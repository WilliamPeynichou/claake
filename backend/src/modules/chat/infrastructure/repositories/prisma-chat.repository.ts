import { Injectable } from "@nestjs/common";
import type { MessageContentType, MessageRole } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { ChatMessageEntity } from "../../domain/entities/chat-message.entity.js";
import type { ChatSessionEntity } from "../../domain/entities/chat-session.entity.js";
import type {
	ChatSessionRepositoryPort,
	ChatSessionWithDetails,
} from "../../domain/ports/chat-session.repository.port.js";
import { ChatMessageMapper } from "../mappers/chat-message.mapper.js";
import { ChatSessionMapper } from "../mappers/chat-session.mapper.js";

@Injectable()
export class PrismaChatRepository implements ChatSessionRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, agentId: string): Promise<ChatSessionEntity> {
		const session = await this.prisma.chatSession.create({
			data: { userId, agentId },
		});
		return ChatSessionMapper.toDomain(session);
	}

	async findById(id: string): Promise<ChatSessionEntity | null> {
		const session = await this.prisma.chatSession.findUnique({ where: { id } });
		return session ? ChatSessionMapper.toDomain(session) : null;
	}

	async findByUser(
		userId: string,
		limit: number,
		offset: number,
	): Promise<{ sessions: ChatSessionWithDetails[]; total: number }> {
		const [sessions, total] = await Promise.all([
			this.prisma.chatSession.findMany({
				where: { userId },
				include: {
					agent: { select: { name: true, imageUrl: true } },
					_count: { select: { messages: true } },
					messages: {
						orderBy: { createdAt: "desc" },
						take: 1,
						select: { content: true },
					},
				},
				orderBy: { updatedAt: "desc" },
				take: limit,
				skip: offset,
			}),
			this.prisma.chatSession.count({ where: { userId } }),
		]);

		return {
			sessions: sessions.map(ChatSessionMapper.toDetailedDomain),
			total,
		};
	}

	async findByUserAndAgent(userId: string, agentId: string): Promise<ChatSessionEntity[]> {
		const sessions = await this.prisma.chatSession.findMany({
			where: { userId, agentId },
			orderBy: { updatedAt: "desc" },
		});
		return sessions.map(ChatSessionMapper.toDomain);
	}

	async updateTitle(id: string, title: string): Promise<void> {
		await this.prisma.chatSession.update({
			where: { id },
			data: { title },
		});
	}

	async delete(id: string): Promise<void> {
		await this.prisma.chatSession.delete({ where: { id } });
	}

	async addMessage(
		sessionId: string,
		role: string,
		content: string,
		contentType = "TEXT",
		mediaUrl: string | null = null,
		metadata: Record<string, unknown> | null = null,
	): Promise<ChatMessageEntity> {
		const [message] = await this.prisma.$transaction([
			this.prisma.chatMessage.create({
				data: {
					sessionId,
					role: role as MessageRole,
					contentType: contentType as MessageContentType,
					content,
					mediaUrl,
					metadata: (metadata as any) ?? undefined,
				},
			}),
			this.prisma.chatSession.update({
				where: { id: sessionId },
				data: { updatedAt: new Date() },
			}),
		]);
		return ChatMessageMapper.toDomain(message);
	}

	async getMessages(
		sessionId: string,
		limit: number,
		offset: number,
	): Promise<{ messages: ChatMessageEntity[]; total: number }> {
		const [messages, total] = await Promise.all([
			this.prisma.chatMessage.findMany({
				where: { sessionId },
				orderBy: { createdAt: "asc" },
				take: limit,
				skip: offset,
			}),
			this.prisma.chatMessage.count({ where: { sessionId } }),
		]);

		return {
			messages: messages.map(ChatMessageMapper.toDomain),
			total,
		};
	}
}
