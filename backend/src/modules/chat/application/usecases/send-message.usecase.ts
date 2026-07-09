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
import type { FileAttachment, ProviderStreamEvent } from "../../domain/ports/ai-provider.port.js";
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
import { ToolRegistryService } from "../services/tool-registry.service.js";

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
		private readonly toolRegistry: ToolRegistryService,
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
		stream: AsyncIterable<ProviderStreamEvent>;
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
		// Backend-owned tool executor: quotas and security enforced here, providers
		// only orchestrate the model loop and feed results back.
		let toolCallCount = 0;
		const executeTool = async (call: { id: string; name: string; input: unknown }) => {
			const output = await this.toolRegistry.execute(
				call.name,
				call.input,
				{ agent, userId, sessionId },
				toolCallCount,
			);
			toolCallCount += 1;
			return output;
		};

		const streamInput = {
			model,
			systemPrompt: buildQualitySystemPrompt(agent, knowledgeContext),
			messages: formattedHistory,
			maxTokens: 4096,
			attachments: attachments.length > 0 ? attachments : undefined,
			tools: this.toolRegistry.getDefinitions(agent),
			executeTool,
			...extraParams,
		};
		const providerStream = provider.streamEvents
			? provider.streamEvents(streamInput)
			: this.textToEvents(provider.streamText(streamInput));

		const stream = this.observeProviderStream(providerStream, {
			sessionId,
			agent,
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
		stream: AsyncIterable<ProviderStreamEvent>,
		context: {
			sessionId: string;
			agent: NonNullable<Awaited<ReturnType<AgentRepositoryPort["findById"]>>>;
			userId: string;
			provider: string;
			model: string;
			startedAt: number;
		},
	): AsyncIterable<ProviderStreamEvent> {
		let outputLength = 0;
		try {
			for await (const event of stream) {
				if (event.type === "text") {
					outputLength += event.delta.length;
				}
				// tool_call/tool_result are emitted by the provider loop itself;
				// execution already happened backend-side via the executeTool callback.
				yield event;
			}
			this.observability.recordProviderSuccess({
				sessionId: context.sessionId,
				agentId: context.agent.id,
				userId: context.userId,
				provider: context.provider,
				model: context.model,
				durationMs: Date.now() - context.startedAt,
				outputLength,
			});
		} catch (error) {
			this.observability.recordProviderError({
				sessionId: context.sessionId,
				agentId: context.agent.id,
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

	private async *textToEvents(stream: AsyncIterable<string>): AsyncIterable<ProviderStreamEvent> {
		for await (const delta of stream) {
			yield { type: "text", delta };
		}
		yield { type: "done" };
	}
}
