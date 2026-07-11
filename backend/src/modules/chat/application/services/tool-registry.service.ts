import { BadRequestException, Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { assertPublicHttpUrl } from "../../../../common/security/public-url.js";
import { AgentKnowledgeService } from "../../../agents/application/services/agent-knowledge.service.js";
import type { AgentToolConfig, AgentToolName } from "../../../agents/domain/agent-tools.js";
import { defaultToolDescription, normalizeAgentTools } from "../../../agents/domain/agent-tools.js";
import type { AgentEntity } from "../../../agents/domain/entities/agent.entity.js";
import {
	MCP_TOOL_PORT,
	type McpToolPort,
	type PreparedMcpTool,
} from "../../../mcp/domain/ports/mcp-tool.port.js";
import type { ProviderToolDefinition } from "../../domain/ports/ai-provider.port.js";

const MAX_TOOL_CALLS_PER_MESSAGE = 5;
const FETCH_TIMEOUT_MS = 5000;
const FETCH_MAX_CHARS = 20_000;

export interface ToolExecutionContext {
	agent: AgentEntity;
	userId: string;
	sessionId: string;
}

export interface PreparedToolCatalog {
	readonly definitions: ProviderToolDefinition[];
	execute(name: string, input: unknown, callIndex: number): Promise<unknown>;
}

@Injectable()
export class ToolRegistryService {
	private readonly logger = new Logger(ToolRegistryService.name);

	constructor(
		private readonly knowledgeService: AgentKnowledgeService,
		@Optional() @Inject(MCP_TOOL_PORT) private readonly mcpToolPort?: McpToolPort,
	) {}

	async prepare(agent: AgentEntity, context: ToolExecutionContext): Promise<PreparedToolCatalog> {
		const builtInTools = this.enabledTools(agent);
		const mcpTools = this.mcpToolPort ? await this.mcpToolPort.prepareTools(agent.id) : [];
		const toolsByName = new Map<string, AgentToolConfig | PreparedMcpTool>();
		const definitions: ProviderToolDefinition[] = [];

		for (const tool of builtInTools) {
			toolsByName.set(tool.name, tool);
			definitions.push({
				name: tool.name,
				description: tool.description ?? defaultToolDescription(tool.name),
				inputSchema: this.schemaFor(tool.name),
			});
		}
		for (const tool of mcpTools) {
			if (toolsByName.has(tool.definition.name)) {
				throw new Error(`Duplicate prepared tool name: ${tool.definition.name}`);
			}
			toolsByName.set(tool.definition.name, tool);
			definitions.push(tool.definition);
		}

		const frozenDefinitions = Object.freeze(
			definitions.map((definition) => Object.freeze(definition)),
		) as ProviderToolDefinition[];
		return Object.freeze({
			definitions: frozenDefinitions,
			execute: (name: string, input: unknown, callIndex: number) =>
				this.executePrepared(toolsByName, name, input, context, callIndex),
		});
	}

	getDefinitions(agent: AgentEntity): ProviderToolDefinition[] {
		return this.enabledTools(agent).map((tool) => ({
			name: tool.name,
			description: tool.description ?? defaultToolDescription(tool.name),
			inputSchema: this.schemaFor(tool.name),
		}));
	}

	enabledTools(agent: AgentEntity): AgentToolConfig[] {
		return normalizeAgentTools(agent.tools).filter((tool) => tool.enabled);
	}

	private async executePrepared(
		toolsByName: ReadonlyMap<string, AgentToolConfig | PreparedMcpTool>,
		name: string,
		input: unknown,
		context: ToolExecutionContext,
		callIndex: number,
	): Promise<unknown> {
		if (callIndex >= MAX_TOOL_CALLS_PER_MESSAGE) {
			throw new BadRequestException("Tool call quota exceeded for this message");
		}
		const tool = toolsByName.get(name);
		if (!tool) throw new BadRequestException(`Tool ${name} is not in the prepared catalogue`);
		if ("definition" in tool) return tool.execute(input);
		return this.executeAndObserve(tool, name, input, context);
	}

	async execute(
		name: string,
		input: unknown,
		context: ToolExecutionContext,
		callIndex: number,
	): Promise<unknown> {
		if (callIndex >= MAX_TOOL_CALLS_PER_MESSAGE) {
			throw new BadRequestException("Tool call quota exceeded for this message");
		}
		const tool = this.enabledTools(context.agent).find((item) => item.name === name);
		if (!tool) {
			throw new BadRequestException(`Tool ${name} is not enabled for this agent`);
		}
		const startedAt = Date.now();
		return this.executeAndObserve(tool, name, input, context, startedAt);
	}

	private async executeAndObserve(
		tool: AgentToolConfig,
		name: string,
		input: unknown,
		context: ToolExecutionContext,
		startedAt = Date.now(),
	): Promise<unknown> {
		try {
			const output = await this.executeEnabledTool(tool, input, context);
			this.logger.log(
				JSON.stringify({
					event: "tool.call.success",
					agentId: context.agent.id,
					sessionId: context.sessionId,
					tool: name,
					durationMs: Date.now() - startedAt,
				}),
			);
			return output;
		} catch (error) {
			this.logger.warn(
				JSON.stringify({
					event: "tool.call.error",
					agentId: context.agent.id,
					sessionId: context.sessionId,
					tool: name,
					durationMs: Date.now() - startedAt,
					error: error instanceof Error ? error.message : "unknown_error",
				}),
			);
			throw error;
		}
	}

	private async executeEnabledTool(
		tool: AgentToolConfig,
		input: unknown,
		context: ToolExecutionContext,
	): Promise<unknown> {
		switch (tool.name) {
			case "current_datetime":
				return this.currentDatetime(tool);
			case "knowledge_search":
				return this.knowledgeSearch(input, context, tool);
			case "fetch_url":
				return this.fetchUrl(input, tool);
		}
	}

	private currentDatetime(tool: AgentToolConfig): { iso: string; timezone: string } {
		return {
			iso: new Date().toISOString(),
			timezone: tool.config?.timezone ?? "UTC",
		};
	}

	private async knowledgeSearch(
		input: unknown,
		context: ToolExecutionContext,
		_tool: AgentToolConfig,
	): Promise<{ query: string; content: string | null }> {
		const query = this.stringInput(input, "query").slice(0, 500);
		const content = await this.knowledgeService.buildKnowledgeContext(context.agent.id, query);
		return { query, content };
	}

	private async fetchUrl(
		input: unknown,
		tool: AgentToolConfig,
	): Promise<{ url: string; content: string }> {
		const url = this.stringInput(input, "url");
		const parsed = await assertPublicHttpUrl(url);
		const allowedDomains = tool.config?.allowed_domains ?? [];
		if (allowedDomains.length === 0 || !allowedDomains.includes(parsed.hostname)) {
			throw new BadRequestException("URL domain is not allowlisted for this agent");
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		try {
			const response = await fetch(parsed.toString(), {
				method: "GET",
				redirect: "error",
				signal: controller.signal,
				headers: { Accept: "text/plain,text/html,application/json" },
			});
			if (!response.ok) throw new BadRequestException("URL fetch failed");
			const contentType = response.headers.get("content-type") ?? "";
			if (!/text|json|html/i.test(contentType)) {
				throw new BadRequestException("URL content type is not supported");
			}
			const text = await response.text();
			return { url: parsed.toString(), content: text.slice(0, FETCH_MAX_CHARS) };
		} finally {
			clearTimeout(timeout);
		}
	}

	private stringInput(input: unknown, key: string): string {
		if (input && typeof input === "object") {
			const value = (input as Record<string, unknown>)[key];
			if (typeof value === "string" && value.trim()) return value.trim();
		}
		throw new BadRequestException(`Tool input.${key} is required`);
	}

	private schemaFor(name: AgentToolName): Record<string, unknown> {
		switch (name) {
			case "current_datetime":
				return { type: "object", properties: {}, additionalProperties: false };
			case "knowledge_search":
				return {
					type: "object",
					properties: { query: { type: "string", maxLength: 500 } },
					required: ["query"],
					additionalProperties: false,
				};
			case "fetch_url":
				return {
					type: "object",
					properties: { url: { type: "string", maxLength: 2048 } },
					required: ["url"],
					additionalProperties: false,
				};
		}
	}
}
