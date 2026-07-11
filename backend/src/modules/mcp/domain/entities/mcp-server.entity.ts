export type McpReviewStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface McpToolEntity {
	id: string;
	serverId: string;
	name: string;
	description: string | null;
	inputSchema: unknown;
	isSelected: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface McpServerEntity {
	id: string;
	agentId: string;
	name: string;
	url: string;
	credentialsEncrypted: string | null;
	reviewStatus: McpReviewStatus;
	reviewReason: string | null;
	isActive: boolean;
	submittedAt: Date | null;
	reviewedAt: Date | null;
	reviewedBy: string | null;
	createdAt: Date;
	updatedAt: Date;
	tools: McpToolEntity[];
}

export function canSubmitMcpServer(server: McpServerEntity): boolean {
	return (
		(server.reviewStatus === "DRAFT" || server.reviewStatus === "REJECTED") &&
		server.tools.some((tool) => tool.isSelected)
	);
}
