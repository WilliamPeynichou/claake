import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import type { ChatMessageEntity } from "../../domain/entities/chat-message.entity.js";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity.js";
import {
	AI_PROVIDER_FACTORY,
	type AIProviderFactoryPort,
} from "../../domain/ports/ai-provider.port.js";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";

@Injectable()
export class SendMessageUseCase {
	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly chatRepo: ChatSessionRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(AI_PROVIDER_FACTORY) private readonly aiFactory: AIProviderFactoryPort,
	) {}

	async execute(
		sessionId: string,
		userId: string,
		content: string,
		contentType = "TEXT",
	): Promise<{
		stream: AsyncIterable<string>;
		onComplete: (fullText: string) => Promise<ChatMessageEntity>;
	}> {
		const session = await this.chatRepo.findById(sessionId);
		if (!session) {
			throw new NotFoundException("Session not found");
		}
		if (!session.isOwnedBy(userId)) {
			throw new ForbiddenException("Access denied");
		}

		const agent = await this.agentRepo.findById(session.agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		// Save user message
		await this.chatRepo.addMessage(sessionId, "USER", content, contentType);

		// Update title on first message
		if (!session.title) {
			const title = ChatSessionEntity.generateTitle(content);
			await this.chatRepo.updateTitle(sessionId, title);
		}

		// Load history
		const { messages: history } = await this.chatRepo.getMessages(sessionId, 100, 0);
		const formattedHistory = history.map((m) => ({
			role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
			content: m.content,
		}));

		// Get AI provider and stream
		const model = agent.models[0] ?? "claude-sonnet-4-20250514";
		const provider = this.aiFactory.getProvider(model);
		const stream = provider.streamText({
			model,
			systemPrompt: agent.systemPrompt ?? agent.longDescription ?? agent.description,
			messages: formattedHistory,
			maxTokens: 4096,
		});

		const onComplete = async (fullText: string): Promise<ChatMessageEntity> => {
			return this.chatRepo.addMessage(sessionId, "ASSISTANT", fullText);
		};

		return { stream, onComplete };
	}
}
