export interface ReviewResponseDto {
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
