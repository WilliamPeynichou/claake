import type { Agent, ChatSession } from "@prisma/client";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity.js";
import type { ChatSessionWithDetails } from "../../domain/ports/chat-session.repository.port.js";

type ChatSessionRaw = ChatSession;

type ChatSessionWithAgent = ChatSession & {
	agent: Pick<Agent, "name" | "imageUrl">;
	_count: { messages: number };
	messages?: Array<{ content: string }>;
};

export class ChatSessionMapper {
	static toDomain(raw: ChatSessionRaw): ChatSessionEntity {
		return new ChatSessionEntity(
			raw.id,
			raw.userId,
			raw.agentId,
			raw.title,
			raw.createdAt,
			raw.updatedAt,
		);
	}

	static toDetailedDomain(raw: ChatSessionWithAgent): ChatSessionWithDetails {
		const entity = new ChatSessionEntity(
			raw.id,
			raw.userId,
			raw.agentId,
			raw.title,
			raw.createdAt,
			raw.updatedAt,
		);

		return Object.assign(entity, {
			agentName: raw.agent.name,
			agentImageUrl: raw.agent.imageUrl,
			messageCount: raw._count.messages,
			lastMessagePreview: raw.messages?.[0]?.content?.slice(0, 100) ?? null,
		});
	}
}
