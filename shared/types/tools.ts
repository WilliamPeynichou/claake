export type AgentToolName = "knowledge_search" | "fetch_url" | "current_datetime";

export interface AgentToolConfig {
	name: AgentToolName;
	enabled: boolean;
	description?: string;
	config?: {
		allowed_domains?: string[];
		max_results?: number;
		timezone?: string;
	};
}

export interface PublicAgentTool {
	name: AgentToolName;
	description: string;
}

export interface ChatToolEvent {
	type: "tool_call" | "tool_result";
	id: string;
	name: AgentToolName | string;
	input?: unknown;
	output?: unknown;
}
