import { Inject, Injectable } from "@nestjs/common";
import {
	ENCRYPTION_SERVICE,
	type EncryptionServicePort,
} from "../../../../common/ports/encryption.port.js";
import type { McpServerEntity } from "../../domain/entities/mcp-server.entity.js";
import {
	MCP_SERVER_REPOSITORY,
	type McpServerRepositoryPort,
} from "../../domain/ports/mcp-server.repository.port.js";
import {
	MCP_TOOL_PORT,
	type McpToolPort,
	type PreparedMcpTool,
} from "../../domain/ports/mcp-tool.port.js";
import { McpHttpClient, type McpTransportCredentials } from "../transport/mcp-http.client.js";
import { McpCircuitBreakerService } from "./mcp-circuit-breaker.service.js";

const MAX_MCP_TOOL_RESULT_CHARS = 20_000;

/** Exposes only persisted, selected and admin-approved MCP tool snapshots to chat. */
@Injectable()
export class McpToolService implements McpToolPort {
	constructor(
		@Inject(MCP_SERVER_REPOSITORY) private readonly repository: McpServerRepositoryPort,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
		private readonly transport: McpHttpClient,
		private readonly circuitBreaker: McpCircuitBreakerService,
	) {}

	async prepareTools(agentId: string): Promise<PreparedMcpTool[]> {
		const servers = await this.repository.findByAgent(agentId);
		const usedAliases = new Set<string>();
		return servers
			.filter((server) => server.reviewStatus === "APPROVED" && server.isActive)
			.flatMap((server) =>
				server.tools
					.filter((tool) => tool.isSelected)
					.map((tool) => ({
						serverId: server.id,
						definition: {
							name: this.alias(server.id, tool.name, usedAliases),
							description: tool.description ?? `MCP tool ${tool.name}`,
							inputSchema: this.objectSchema(tool.inputSchema),
						},
						execute: (input: unknown) => this.execute(server.id, tool.name, input),
					})),
			);
	}

	private async execute(serverId: string, toolName: string, input: unknown): Promise<unknown> {
		this.circuitBreaker.assertAvailable(serverId);
		const server = await this.repository.findById(serverId);
		const tool = server?.tools.find((item) => item.name === toolName && item.isSelected);
		if (!server || !tool || server.reviewStatus !== "APPROVED" || !server.isActive) {
			throw new Error("MCP tool is no longer available");
		}
		if (!input || typeof input !== "object" || Array.isArray(input)) {
			throw new Error("MCP tool input must be an object");
		}
		try {
			const result = await this.transport.callTool(
				{ url: server.url, credentials: this.credentials(server) },
				tool.name,
				input as Record<string, unknown>,
			);
			this.circuitBreaker.recordSuccess(serverId);
			return this.boundResult(result);
		} catch (error) {
			this.circuitBreaker.recordFailure(serverId);
			throw error;
		}
	}

	/** Deterministic per prepare(): tools are sorted by name; collisions get a numeric suffix. */
	private alias(serverId: string, toolName: string, used: Set<string>): string {
		const safeToolName = toolName
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, "_")
			.slice(0, 36);
		const base = `mcp_${serverId.replace(/-/g, "").slice(0, 12)}_${safeToolName}`;
		let alias = base;
		for (let index = 2; used.has(alias); index++) alias = `${base}_${index}`;
		used.add(alias);
		return alias;
	}

	private objectSchema(schema: unknown): Record<string, unknown> {
		if (!schema || typeof schema !== "object" || Array.isArray(schema)) return { type: "object" };
		return schema as Record<string, unknown>;
	}

	private credentials(server: McpServerEntity): McpTransportCredentials | undefined {
		if (!server.credentialsEncrypted) return undefined;
		return { headers: JSON.parse(this.encryption.decrypt(server.credentialsEncrypted)) };
	}

	private boundResult(result: unknown): unknown {
		const serialized = JSON.stringify(result);
		return serialized.length <= MAX_MCP_TOOL_RESULT_CHARS
			? result
			: { truncated: true, content: serialized.slice(0, MAX_MCP_TOOL_RESULT_CHARS) };
	}
}

export { MCP_TOOL_PORT };
