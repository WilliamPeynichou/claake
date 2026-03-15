import type { ChatSessionWithDetails } from "../../domain/ports/chat-session.repository.port.js";
import type { ChatSessionResponseDto } from "../dtos/chat-session-response.dto.js";

export class ChatSessionTransformer {
	static toDto(entity: ChatSessionWithDetails): ChatSessionResponseDto {
		return {
			id: entity.id,
			agent_id: entity.agentId,
			agent_name: entity.agentName,
			agent_image_url: entity.agentImageUrl,
			title: entity.title,
			message_count: entity.messageCount,
			last_message_preview: entity.lastMessagePreview,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
		};
	}
}
