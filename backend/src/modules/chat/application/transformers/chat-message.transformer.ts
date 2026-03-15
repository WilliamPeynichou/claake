import type { ChatMessageEntity } from "../../domain/entities/chat-message.entity.js";
import type { ChatMessageResponseDto } from "../dtos/chat-message-response.dto.js";

export class ChatMessageTransformer {
	static toDto(entity: ChatMessageEntity): ChatMessageResponseDto {
		return {
			id: entity.id,
			session_id: entity.sessionId,
			role: entity.role.toLowerCase(),
			content_type: entity.contentType.toLowerCase(),
			content: entity.content,
			media_url: entity.mediaUrl,
			metadata: entity.metadata,
			created_at: entity.createdAt.toISOString(),
		};
	}
}
