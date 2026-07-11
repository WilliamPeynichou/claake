export type McpReviewStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface McpTool {
	id: string;
	name: string;
	description: string | null;
	input_schema: Record<string, unknown>;
	selected: boolean;
}

/** Private owner/admin representation. Credentials are deliberately never returned. */
export interface McpServer {
	id: string;
	agent_id: string;
	name: string;
	url: string;
	auth_type: "NONE" | "API_KEY";
	has_credentials: boolean;
	review_status: McpReviewStatus;
	review_reason: string | null;
	enabled: boolean;
	tools: McpTool[];
	created_at: string;
	updated_at: string;
}

export type McpAuthInput =
	| { type: "NONE" }
	| { type: "BEARER"; token: string }
	| { type: "API_KEY"; header: string; value: string };

export interface CreateMcpServerInput {
	name: string;
	url: string;
	/** Write-only credentials, encrypted by API. */
	auth?: McpAuthInput;
}

export interface UpdateMcpServerInput {
	name?: string;
	url?: string;
	/** Write-only credentials, encrypted by API. */
	auth?: McpAuthInput;
	enabled?: boolean;
}

export interface SelectMcpToolsInput {
	tool_ids: string[];
}

export type McpReviewItem = McpServer;
export type McpReviewDecision = "approve" | "reject" | "suspend";
