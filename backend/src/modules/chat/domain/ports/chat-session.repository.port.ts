import type { ChatMessageEntity } from "../entities/chat-message.entity.js";
import type { ChatSessionEntity } from "../entities/chat-session.entity.js";

export const CHAT_SESSION_REPOSITORY = Symbol("CHAT_SESSION_REPOSITORY");

export interface ChatSessionWithDetails extends ChatSessionEntity {
	agentName: string;
	agentImageUrl: string | null;
	messageCount: number;
	lastMessagePreview: string | null;
}

export interface ChatSessionRepositoryPort {
	create(userId: string, agentId: string): Promise<ChatSessionEntity>;
	findById(id: string): Promise<ChatSessionEntity | null>;
	findByUser(
		userId: string,
		limit: number,
		offset: number,
	): Promise<{ sessions: ChatSessionWithDetails[]; total: number }>;
	findByUserAndAgent(userId: string, agentId: string): Promise<ChatSessionEntity[]>;
	updateTitle(id: string, title: string): Promise<void>;
	delete(id: string): Promise<void>;
	addMessage(
		sessionId: string,
		role: string,
		content: string,
		contentType?: string,
		mediaUrl?: string | null,
		metadata?: Record<string, unknown> | null,
	): Promise<ChatMessageEntity>;
	getMessages(
		sessionId: string,
		limit: number,
		offset: number,
	): Promise<{ messages: ChatMessageEntity[]; total: number }>;
}
