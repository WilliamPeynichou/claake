import { Injectable } from "@nestjs/common";
import { assertPublicHttpUrl } from "../../../../common/security/public-url.js";

const MCP_PROTOCOL_VERSION = "2025-03-26";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_TOOLS = 100;
const MAX_SCHEMA_BYTES = 64 * 1024;
const MAX_ARGUMENT_BYTES = 256 * 1024;

export interface McpTransportCredentials {
	headers?: Record<string, string>;
}

export interface McpTransportConfig {
	url: string;
	credentials?: McpTransportCredentials;
	timeoutMs?: number;
}

export interface McpTool {
	name: string;
	description?: string;
	inputSchema: Record<string, unknown>;
}

export interface McpCallResult {
	content: unknown[];
	isError: boolean;
	structuredContent?: unknown;
}

interface JsonRpcResponse {
	jsonrpc: "2.0";
	id?: string | number | null;
	result?: unknown;
	error?: { code?: number; message?: string };
}

interface McpSession {
	config: McpTransportConfig;
	url: URL;
	sessionId?: string;
	nextId: number;
}

@Injectable()
export class McpHttpClient {
	async initialize(config: McpTransportConfig): Promise<{ protocolVersion: string }> {
		const session = await this.createSession(config);
		return this.initializeSession(session);
	}

	async listTools(config: McpTransportConfig): Promise<McpTool[]> {
		const session = await this.createSession(config);
		await this.initializeSession(session);
		const tools: McpTool[] = [];
		let cursor: string | undefined;
		do {
			const result = this.asObject(
				await this.request(session, "tools/list", cursor ? { cursor } : {}),
				"Invalid MCP tools/list result",
			);
			const page = Array.isArray(result.tools) ? result.tools : [];
			for (const value of page) {
				if (tools.length >= MAX_TOOLS) throw new Error("MCP tool count exceeded maximum");
				tools.push(this.normalizeTool(value));
			}
			cursor =
				typeof result.nextCursor === "string" && result.nextCursor ? result.nextCursor : undefined;
		} while (cursor);
		return tools;
	}

	async callTool(
		config: McpTransportConfig,
		name: string,
		argumentsValue: Record<string, unknown>,
	): Promise<McpCallResult> {
		if (!name.trim() || name.length > 200) throw new Error("Invalid MCP tool name");
		if (this.jsonSize(argumentsValue) > MAX_ARGUMENT_BYTES) {
			throw new Error("MCP tool arguments exceeded maximum size");
		}
		const session = await this.createSession(config);
		await this.initializeSession(session);
		const result = this.asObject(
			await this.request(session, "tools/call", { name, arguments: argumentsValue }),
			"Invalid MCP tools/call result",
		);
		return {
			content: Array.isArray(result.content) ? result.content : [],
			isError: result.isError === true,
			...(result.structuredContent === undefined
				? {}
				: { structuredContent: result.structuredContent }),
		};
	}

	private async createSession(config: McpTransportConfig): Promise<McpSession> {
		const url = await assertPublicHttpUrl(config.url);
		if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
			throw new Error("MCP endpoint must use HTTPS in production");
		}
		this.validateHeaders(config.credentials?.headers ?? {});
		return { config, url, nextId: 1 };
	}

	private async initializeSession(session: McpSession): Promise<{ protocolVersion: string }> {
		const result = this.asObject(
			await this.request(session, "initialize", {
				protocolVersion: MCP_PROTOCOL_VERSION,
				capabilities: {},
				clientInfo: { name: "claake", version: "1.0.0" },
			}),
			"Invalid MCP initialize result",
		);
		if (typeof result.protocolVersion !== "string") {
			throw new Error("Invalid MCP initialize protocol version");
		}
		await this.notification(session, "notifications/initialized");
		return { protocolVersion: result.protocolVersion };
	}

	private async request(session: McpSession, method: string, params: unknown): Promise<unknown> {
		const id = session.nextId++;
		const response = await this.post(session, { jsonrpc: "2.0", id, method, params });
		if (response.id !== id) throw new Error("Invalid MCP JSON-RPC response id");
		if (response.error) throw new Error("MCP server returned a JSON-RPC error");
		if (!("result" in response)) throw new Error("Invalid MCP JSON-RPC response");
		return response.result;
	}

	private async notification(session: McpSession, method: string): Promise<void> {
		await this.post(session, { jsonrpc: "2.0", method });
	}

	private async post(session: McpSession, body: Record<string, unknown>): Promise<JsonRpcResponse> {
		// Re-resolve before every network request to mitigate DNS rebinding between calls.
		const url = await assertPublicHttpUrl(session.url.toString());
		const timeoutMs = Math.min(
			Math.max(session.config.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1),
			MAX_TIMEOUT_MS,
		);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(url, {
				method: "POST",
				redirect: "error",
				signal: controller.signal,
				headers: {
					Accept: "application/json, text/event-stream",
					"Content-Type": "application/json",
					...(session.config.credentials?.headers ?? {}),
					...(session.sessionId ? { "Mcp-Session-Id": session.sessionId } : {}),
				},
				body: JSON.stringify(body),
			});
			const returnedSessionId = response.headers.get("mcp-session-id");
			if (returnedSessionId) session.sessionId = returnedSessionId.slice(0, 1024);
			if (!response.ok) {
				await response.body?.cancel().catch(() => undefined);
				throw new Error(`MCP endpoint returned HTTP ${response.status}`);
			}
			return this.readResponse(response);
		} finally {
			clearTimeout(timeout);
		}
	}

	private async readResponse(response: Response): Promise<JsonRpcResponse> {
		const text = await this.readBoundedText(response);
		const contentType = response.headers.get("content-type") ?? "";
		let value: unknown;
		if (contentType.toLowerCase().includes("text/event-stream")) {
			const data = text
				.split(/\r?\n/)
				.filter((line) => line.startsWith("data:"))
				.map((line) => line.slice(5).trim())
				.find((line) => line && line !== "[DONE]");
			if (!data) throw new Error("Empty MCP event stream response");
			value = this.parseJson(data);
		} else {
			value = this.parseJson(text);
		}
		return this.asObject(value, "Invalid MCP JSON-RPC response") as unknown as JsonRpcResponse;
	}

	private async readBoundedText(response: Response): Promise<string> {
		const declared = Number(response.headers.get("content-length"));
		if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
			await response.body?.cancel().catch(() => undefined);
			throw new Error("MCP response exceeded maximum size");
		}
		if (!response.body) return "";
		const reader = response.body.getReader();
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > MAX_RESPONSE_BYTES) throw new Error("MCP response exceeded maximum size");
				chunks.push(value);
			}
		} finally {
			await reader.cancel().catch(() => undefined);
			reader.releaseLock();
		}
		const joined = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			joined.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return new TextDecoder().decode(joined);
	}

	private normalizeTool(value: unknown): McpTool {
		const tool = this.asObject(value, "Invalid MCP tool definition");
		if (typeof tool.name !== "string" || !tool.name.trim() || tool.name.length > 200) {
			throw new Error("Invalid MCP tool name");
		}
		const inputSchema = this.asObject(tool.inputSchema ?? {}, "Invalid MCP tool input schema");
		if (this.jsonSize(inputSchema) > MAX_SCHEMA_BYTES) {
			throw new Error("MCP tool schema exceeded maximum size");
		}
		return {
			name: tool.name,
			...(typeof tool.description === "string"
				? { description: tool.description.slice(0, 4000) }
				: {}),
			inputSchema,
		};
	}

	private validateHeaders(headers: Record<string, string>): void {
		if (Object.keys(headers).length > 20) throw new Error("Too many MCP credential headers");
		for (const [name, value] of Object.entries(headers)) {
			if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n]/.test(value)) {
				throw new Error("Invalid MCP credential header");
			}
			if (
				["host", "content-length", "content-type", "accept", "mcp-session-id"].includes(
					name.toLowerCase(),
				)
			) {
				throw new Error("Reserved MCP credential header");
			}
		}
	}

	private parseJson(value: string): unknown {
		try {
			return JSON.parse(value);
		} catch {
			throw new Error("Invalid MCP JSON response");
		}
	}

	private asObject(value: unknown, message: string): Record<string, unknown> {
		if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
		return value as Record<string, unknown>;
	}

	private jsonSize(value: unknown): number {
		try {
			return Buffer.byteLength(JSON.stringify(value), "utf8");
		} catch {
			throw new Error("MCP value is not JSON serializable");
		}
	}
}
