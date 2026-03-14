export interface Agent {
	id: string;
	name: string;
	slug: string;
	description: string;
	long_description: string | null;
	category: string;
	tags: string[];
	price: number;
	price_type: "free" | "one_time" | "subscription" | "pay_per_use";
	image_url: string | null;
	screenshots: string[];
	creator_id: string;
	creator_name: string | null;
	model: string;
	mode: "local" | "cloud" | "hybrid";
	version: string;
	status: "draft" | "pending" | "published" | "rejected";
	downloads_count: number;
	average_rating: number;
	reviews_count: number;
	sandbox_uses: number;
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	role: "user" | "developer" | "admin";
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export interface AgentCategory {
	id: string;
	name: string;
	slug: string;
	description: string;
	icon: string;
	agent_count: number;
}

export interface ApiKeyConfig {
	id: string;
	provider: string;
	label: string;
	key_preview: string;
	created_at: string;
}
