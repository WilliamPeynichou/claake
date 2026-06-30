export class AgentChatConfigResponseDto {
	id!: string;
	name!: string;
	description!: string;
	image_url!: string | null;
	status!: string;
	mode!: string;
	models!: string[];
	provider!: string | null;
	cloud_strategy!: string | null;
	required_user_provider!: string | null;
	welcome_message!: string | null;
	suggested_prompts!: string[];
	limitations!: string[];
	capabilities!: {
		files: boolean;
		images: boolean;
	};
	access!: {
		can_chat: boolean;
		reason?: "login_required" | "api_key_required" | "purchase_required" | "not_published";
		required_provider?: string;
	};
}
