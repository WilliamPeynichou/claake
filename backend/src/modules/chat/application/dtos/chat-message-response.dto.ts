export class ChatMessageResponseDto {
	id!: string;
	session_id!: string;
	role!: string;
	content_type!: string;
	content!: string;
	media_url!: string | null;
	metadata!: Record<string, unknown> | null;
	created_at!: string;
}
