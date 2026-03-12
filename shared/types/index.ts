export interface Agent {
	id: string;
	name: string;
	description: string;
	category: string;
	price: number;
	image_url: string | null;
	creator_id: string;
	status: "draft" | "pending" | "published" | "rejected";
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
	role: "user" | "creator" | "admin";
	created_at: string;
	updated_at: string;
}
