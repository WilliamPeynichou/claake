export interface AdminPermissions {
	canManageUsers: boolean;
	canManageAgents: boolean;
	canManageCategories: boolean;
	canManageReviews: boolean;
	canViewStats: boolean;
	canViewActivity: boolean;
}

export type CloudStrategy = "seller_endpoint" | "seller_api_key" | "user_api_key";
export type EndpointFormat =
	| "openai"
	| "anthropic"
	| "google"
	| "mistral"
	| "cohere"
	| "deepseek"
	| "groq"
	| "xai"
	| "perplexity"
	| "meta"
	| "together"
	| "fireworks"
	| "huggingface"
	| "claake";

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
	system_prompt?: string | null;
	cloud_strategy: CloudStrategy | null;
	endpoint_format: EndpointFormat | null;
	required_user_provider: string | null;
	docker_image: string | null;
	download_url: string | null;
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
	role: "user" | "developer" | "admin" | "super_admin";
	admin_permissions: AdminPermissions | null;
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
	verified_interaction: boolean;
	helpful_count: number;
	user_name: string | null;
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

export interface ChatSession {
	id: string;
	agent_id: string;
	agent_name: string;
	agent_image_url: string | null;
	title: string | null;
	message_count: number;
	last_message_preview: string | null;
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: string;
	session_id?: string;
	role: "user" | "assistant" | "system";
	content_type?: "text" | "image" | "video";
	content: string;
	media_url?: string | null;
	metadata?: Record<string, unknown> | null;
	timestamp?: string;
	created_at?: string;
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

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	requiresManualReview: boolean;
}

export interface CreatorProfile {
	id: string;
	display_name: string | null;
	avatar_url: string | null;
	bio: string | null;
	portfolio_links: { label: string; url: string }[];
	published_agents: Agent[];
	stats: {
		total_agents: number;
		total_reviews: number;
		average_rating: number;
	};
}

export interface CommissionEntry {
	id: string;
	amount: number;
	platform_fee: number;
	creator_payout: number;
	commission_rate: number;
	sale_number: number;
	agent_id: string;
	created_at: string;
}

export interface CreatorEarnings {
	total_earnings: number;
	total_platform_fees: number;
	total_sales: number;
	commissions: CommissionEntry[];
}

export interface ConnectStatus {
	connected: boolean;
	details_submitted: boolean;
	payouts_enabled: boolean;
}

export interface ActivityLog {
	id: string;
	actor_id: string;
	actor_email: string;
	action: string;
	target_type: string;
	target_id: string;
	metadata: Record<string, unknown> | null;
	created_at: string;
}
