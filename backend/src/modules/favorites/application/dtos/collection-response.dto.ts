export interface CollectionResponseDto {
	id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	agent_ids: string[];
	user_id: string;
	created_at: string;
}
