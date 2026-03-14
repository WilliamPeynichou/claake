export interface Agent {
	id: string;
	name: string;
	slug: string;
	description: string;
	long_description: string | null;
	category: string;
	tags: string[];
	models: string[];
	mode: "local" | "cloud" | "hybrid";
	config_url: string | null;
	image_url: string | null;
	screenshots: string[];
	pricing_model: "free" | "one_time" | "subscription" | "pay_per_use";
	price: number;
	credit_cost: number;
	status: "draft" | "pending" | "approved" | "rejected" | "suspended";
	permissions: Record<string, unknown> | null;
	download_count: number;
	rating: number;
	review_count: number;
	creator_id: string;
	creator_name: string | null;
	created_at: string;
	updated_at: string;
}

export interface AgentVersion {
	id: string;
	agent_id: string;
	version: string;
	config_url: string;
	changelog: string | null;
	security_scan_status: "pending" | "passed" | "failed" | "manual_review";
	is_active: boolean;
	created_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	display_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	role: "user" | "developer" | "admin";
	has_stripe_account: boolean;
	agents_count: number;
	created_at: string;
	updated_at: string;
}

export interface Purchase {
	id: string;
	user_id: string;
	agent_id: string;
	amount: number;
	currency: string;
	created_at: string;
}

export interface Subscription {
	id: string;
	user_id: string;
	agent_id: string;
	status: "active" | "cancelled" | "past_due";
	current_period_end: string | null;
	created_at: string;
}

export interface Review {
	id: string;
	user_id: string;
	agent_id: string;
	rating: number;
	comment: string | null;
	verified_purchase: boolean;
	helpful_count: number;
	created_at: string;
	updated_at: string;
}

export interface Collection {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	agent_ids: string[];
	created_at: string;
}

export interface Favorite {
	id: string;
	user_id: string;
	agent_id: string;
	created_at: string;
}

export interface UsageCredits {
	id: string;
	user_id: string;
	balance: number;
}

export interface Pipeline {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	agent_sequence: unknown[];
	is_public: boolean;
	price: number | null;
	created_at: string;
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
