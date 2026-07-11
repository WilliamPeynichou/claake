import type { McpReviewStatus, McpServerEntity } from "../entities/mcp-server.entity.js";

export const MCP_SERVER_REPOSITORY = Symbol("MCP_SERVER_REPOSITORY");

export interface CreateMcpServerData {
	agentId: string;
	name: string;
	url: string;
	credentialsEncrypted?: string;
}

export interface UpdateMcpServerData {
	name?: string;
	url?: string;
	credentialsEncrypted?: string | null;
	isActive?: boolean;
}

export interface DiscoveredMcpTool {
	name: string;
	description?: string;
	inputSchema: unknown;
}

export interface McpServerRepositoryPort {
	findByAgent(agentId: string): Promise<McpServerEntity[]>;
	findPending(): Promise<McpServerEntity[]>;
	findById(id: string): Promise<McpServerEntity | null>;
	create(data: CreateMcpServerData): Promise<McpServerEntity>;
	update(id: string, data: UpdateMcpServerData): Promise<McpServerEntity>;
	delete(id: string): Promise<void>;
	replaceTools(id: string, tools: DiscoveredMcpTool[]): Promise<McpServerEntity>;
	selectTools(id: string, names: string[]): Promise<McpServerEntity>;
	setReview(
		id: string,
		data: {
			status: McpReviewStatus;
			reason?: string | null;
			reviewedBy?: string | null;
		},
	): Promise<McpServerEntity>;
}
