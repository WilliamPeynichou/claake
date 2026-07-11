import type { ProviderToolDefinition } from "../../../chat/domain/ports/ai-provider.port.js";

export const MCP_TOOL_PORT = Symbol("MCP_TOOL_PORT");

export interface PreparedMcpTool {
	definition: ProviderToolDefinition;
	execute(input: unknown): Promise<unknown>;
}

export interface McpToolPort {
	prepareTools(agentId: string): Promise<PreparedMcpTool[]>;
}
