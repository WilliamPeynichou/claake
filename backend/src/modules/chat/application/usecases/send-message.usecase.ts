import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { AgentKnowledgeService } from "../../../agents/application/services/agent-knowledge.service.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import type { ChatMessageEntity } from "../../domain/entities/chat-message.entity.js";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity.js";
import type { FileAttachment } from "../../domain/ports/ai-provider.port.js";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";
import { ChatObservabilityService } from "../services/chat-observability.service.js";
import { ChatQuotaService } from "../services/chat-quota.service.js";
import {
	EXECUTION_STRATEGY_RESOLVER,
	type ExecutionStrategyResolver,
} from "../services/execution-strategy.resolver.js";

function buildQualitySystemPrompt(
	agent: NonNullable<Awaited<ReturnType<AgentRepositoryPort["findById"]>>>,
	knowledgeContext?: string | null,
): string | null {
	const sections: string[] = [];
	const basePrompt = agent.systemPrompt ?? agent.longDescription;
	if (basePrompt) sections.push(basePrompt);
	if (agent.variables && Object.keys(agent.variables).length > 0) {
		sections.push(`Variables agent:\n${JSON.stringify(agent.variables, null, 2)}`);
	}
	if (agent.fewShotExamples.length > 0) {
		sections.push(`Exemples few-shot:\n${JSON.stringify(agent.fewShotExamples, null, 2)}`);
	}
	if (agent.outputFormat) {
		sections.push(`Format de sortie attendu:\n${agent.outputFormat}`);
	}
	if (knowledgeContext) {
		sections.push(`Base de connaissances:\n${knowledgeContext}`);
	}
	return sections.length ? sections.join("\n\n") : null;
}

@Injectable()
export class SendMessageUseCase {
	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly chatRepo: ChatSessionRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(EXECUTION_STRATEGY_RESOLVER)
		private readonly strategyResolver: ExecutionStrategyResolver,
		private readonly quotaService: ChatQuotaService,
		private readonly knowledgeService: AgentKnowledgeService,
		private readonly observability: ChatObservabilityService,
	) {}

	async execute(
		sessionId: string,
		userId: string,
		content: string,
		contentType = "TEXT",
		attachments: FileAttachment[] = [],
		attachmentIds: string[] = [],
		actorRole?: string,
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
		const canTest =
			(agent.isOwnedBy(userId) && (agent.status === "DRAFT" || agent.status === "REJECTED")) ||
			((actorRole === "ADMIN" || actorRole === "SUPER_ADMIN") && agent.status === "PENDING");
		if (!agent.isPublished() && !canTest) {
			throw new BadRequestException("This agent is not available");
		}
		if (!agent.isFree() && !agent.isOwnedBy(userId)) {
			const [purchased, subscribed] = await Promise.all([
				this.agentRepo.hasPurchased(userId, agent.id),
				this.agentRepo.hasActiveSubscription(userId, agent.id),
			]);
			if (!purchased && !subscribed) {
				throw new ForbiddenException("Purchase required to use this agent");
			}
		}

		// Enforce per-user chat quotas before persisting anything
		await this.quotaService.assertWithinQuota(userId, content.length);

		// Save user message
		await this.chatRepo.addMessage(
			sessionId,
			"USER",
			content,
			contentType,
			null,
			null,
			attachmentIds,
		);

		// Update title on first message
		if (!session.title) {
			const title = ChatSessionEntity.generateTitle(content);
			await this.chatRepo.updateTitle(sessionId, title);
		}

		// Load history
		const { messages: history } = await this.chatRepo.getMessages(
			sessionId,
			this.quotaService.maxHistoryMessages,
			0,
		);
		const formattedHistory = history.map((m) => ({
			role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
			content: m.content,
		}));

		// Resolve execution strategy for this agent
		const { provider, extraParams } = await this.strategyResolver.resolve(agent, userId);
		const knowledgeContext = await this.knowledgeService.buildKnowledgeContext(agent.id, content);

		const model = agent.models[0] ?? "claude-sonnet-4-20250514";
		const providerName = provider.constructor.name;
		const startedAt = Date.now();
		this.observability.recordMessageStarted({
			sessionId,
			agentId: agent.id,
			userId,
			provider: providerName,
			model,
			contentLength: content.length,
			attachmentCount: attachments.length,
		});
		const providerStream = provider.streamText({
			model,
			systemPrompt: buildQualitySystemPrompt(agent, knowledgeContext),
			messages: formattedHistory,
			maxTokens: 4096,
			attachments: attachments.length > 0 ? attachments : undefined,
			...extraParams,
		});

		const stream = this.observeProviderStream(providerStream, {
			sessionId,
			agentId: agent.id,
			userId,
			provider: providerName,
			model,
			startedAt,
		});

		const onComplete = async (fullText: string): Promise<ChatMessageEntity> => {
			const message = await this.chatRepo.addMessage(sessionId, "ASSISTANT", fullText);
			this.observability.recordAssistantMessageSaved({
				sessionId,
				agentId: agent.id,
				userId,
				provider: providerName,
				model,
				durationMs: Date.now() - startedAt,
				outputLength: fullText.length,
			});
			return message;
		};

		return { stream, onComplete };
	}

	private async *observeProviderStream(
		stream: AsyncIterable<string>,
		context: {
			sessionId: string;
			agentId: string;
			userId: string;
			provider: string;
			model: string;
			startedAt: number;
		},
	): AsyncIterable<string> {
		let outputLength = 0;
		try {
			for await (const chunk of stream) {
				outputLength += chunk.length;
				yield chunk;
			}
			this.observability.recordProviderSuccess({
				sessionId: context.sessionId,
				agentId: context.agentId,
				userId: context.userId,
				provider: context.provider,
				model: context.model,
				durationMs: Date.now() - context.startedAt,
				outputLength,
			});
		} catch (error) {
			this.observability.recordProviderError({
				sessionId: context.sessionId,
				agentId: context.agentId,
				userId: context.userId,
				provider: context.provider,
				model: context.model,
				durationMs: Date.now() - context.startedAt,
				outputLength,
				error: error instanceof Error ? error.message : "unknown_error",
			});
			throw error;
		}
	}
}
