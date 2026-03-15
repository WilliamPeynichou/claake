import type { ChatMessage } from "@prisma/client";
import { ChatMessageEntity } from "../../domain/entities/chat-message.entity.js";

export class ChatMessageMapper {
	static toDomain(raw: ChatMessage): ChatMessageEntity {
		return new ChatMessageEntity(
			raw.id,
			raw.sessionId,
			raw.role,
			raw.contentType,
			raw.content,
			raw.mediaUrl,
			raw.metadata as Record<string, unknown> | null,
			raw.createdAt,
		);
	}
}
