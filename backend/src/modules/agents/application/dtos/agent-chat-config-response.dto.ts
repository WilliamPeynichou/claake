import type { PublicAgentTool } from "@claake/shared";

export type AgentChatConfigStatus = "approved" | "draft" | "pending" | "rejected" | "suspended";

export type AgentChatConfigMode = "cloud" | "local" | "hybrid";

export type AgentChatConfigCloudStrategy = "seller_endpoint" | "seller_api_key" | "user_api_key";

export type AgentChatConfigAccessReason =
	| "login_required"
	| "api_key_required"
	| "purchase_required"
	| "not_published";

export class AgentChatConfigResponseDto {
	id!: string;
	name!: string;
	description!: string;
	image_url!: string | null;
	status!: AgentChatConfigStatus;
	mode!: AgentChatConfigMode;
	models!: string[];
	provider!: string | null;
	cloud_strategy!: AgentChatConfigCloudStrategy | null;
	required_user_provider!: string | null;
	welcome_message!: string | null;
	suggested_prompts!: string[];
	limitations!: string[];
	variables!: Record<string, unknown> | null;
	few_shot_examples!: Record<string, unknown>[];
	output_format!: string | null;
	quality_checklist!: string[];
	tools!: PublicAgentTool[];
	capabilities!: {
		files: boolean;
		images: boolean;
	};
	access!: {
		can_chat: boolean;
		reason?: AgentChatConfigAccessReason;
		required_provider?: string;
	};
}
