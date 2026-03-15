export class ChatSessionResponseDto {
	id!: string;
	agent_id!: string;
	agent_name!: string;
	agent_image_url!: string | null;
	title!: string | null;
	message_count!: number;
	last_message_preview!: string | null;
	created_at!: string;
	updated_at!: string;
}
