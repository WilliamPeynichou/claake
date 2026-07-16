import { BadRequestException } from "@nestjs/common";
import { CreateAgentUseCase } from "../src/modules/agents/application/usecases/create-agent.usecase";
import { GetAgentChatConfigUseCase } from "../src/modules/agents/application/usecases/get-agent-chat-config.usecase";
import { ReviewAgentUseCase } from "../src/modules/agents/application/usecases/review-agent.usecase";
import { SubmitAgentForReviewUseCase } from "../src/modules/agents/application/usecases/submit-agent-for-review.usecase";
import { ValidateAgentUseCase } from "../src/modules/agents/application/usecases/validate-agent.usecase";
import { AgentEntity } from "../src/modules/agents/domain/entities/agent.entity";
import { CreateSessionUseCase } from "../src/modules/chat/application/usecases/create-session.usecase";
import { SendMessageUseCase } from "../src/modules/chat/application/usecases/send-message.usecase";
import { ChatMessageEntity } from "../src/modules/chat/domain/entities/chat-message.entity";
import { ChatSessionEntity } from "../src/modules/chat/domain/entities/chat-session.entity";

class InMemoryAgentRepository {
	private agents = new Map<string, AgentEntity>();
	private nextId = 1;

	async findAll() {
		return { agents: [...this.agents.values()], total: this.agents.size };
	}

	async findById(id: string) {
		return this.agents.get(id) ?? null;
	}

	async findBySlug(slug: string) {
		return [...this.agents.values()].find((agent) => agent.slug === slug) ?? null;
	}

	async create(data: Partial<AgentEntity>) {
		const agent = this.makeAgent(`agent-${this.nextId++}`, data, "DRAFT");
		this.agents.set(agent.id, agent);
		return agent;
	}

	async update(id: string, data: Partial<AgentEntity>) {
		const current = await this.findById(id);
		if (!current) throw new Error("Agent not found");
		const updated = this.makeAgent(id, { ...this.toData(current), ...data }, current.status);
		this.agents.set(id, updated);
		return updated;
	}

	async updateStatus(id: string, status: string) {
		const current = await this.findById(id);
		if (!current) throw new Error("Agent not found");
		this.agents.set(id, this.makeAgent(id, this.toData(current), status));
	}

	async updateRating() {}
	async softDelete() {}
	async hasPurchased() {
		return false;
	}
	async hasActiveSubscription() {
		return false;
	}

	private toData(agent: AgentEntity): Partial<AgentEntity> {
		return {
			name: agent.name,
			slug: agent.slug,
			description: agent.description,
			longDescription: agent.longDescription,
			category: agent.category,
			tags: agent.tags,
			models: agent.models,
			mode: agent.mode,
			configUrl: agent.configUrl,
			imageUrl: agent.imageUrl,
			pricingModel: agent.pricingModel,
			price: agent.price,
			creditCost: agent.creditCost,
			creatorId: agent.creatorId,
			creatorName: agent.creatorName,
			systemPrompt: agent.systemPrompt,
			cloudStrategy: agent.cloudStrategy,
			requiredUserProvider: agent.requiredUserProvider,
			welcomeMessage: agent.welcomeMessage,
			suggestedPrompts: agent.suggestedPrompts,
			limitations: agent.limitations,
			modelSettings: agent.modelSettings,
			capabilities: agent.capabilities,
			variables: agent.variables,
			fewShotExamples: agent.fewShotExamples,
			outputFormat: agent.outputFormat,
			qualityChecklist: agent.qualityChecklist,
		};
	}

	private makeAgent(id: string, data: Partial<AgentEntity>, status: string): AgentEntity {
		return new AgentEntity(
			id,
			data.name ?? "Agent MVP",
			data.slug ?? "agent-mvp",
			data.description ?? "Agent utile pour parcours MVP",
			data.longDescription ?? null,
			data.category ?? "productivity",
			data.tags ?? ["mvp"],
			data.models ?? ["claude-sonnet-4-20250514"],
			data.mode ?? "CLOUD",
			data.configUrl ?? null,
			data.imageUrl ?? null,
			[],
			data.pricingModel ?? "FREE",
			data.price ?? 0,
			data.creditCost ?? 1,
			status,
			null,
			0,
			0,
			0,
			data.creatorId ?? "creator-1",
			data.creatorName ?? "Créateur",
			new Date(),
			new Date(),
			data.systemPrompt ?? "Tu es un assistant MVP utile.",
			data.cloudStrategy ?? "USER_API_KEY",
			null,
			null,
			null,
			null,
			data.requiredUserProvider ?? "anthropic",
			null,
			null,
			data.welcomeMessage ?? "Bonjour, prêt à aider.",
			data.suggestedPrompts ?? ["Aide-moi à tester ce flux"],
			data.limitations ?? ["Test MVP"],
			data.modelSettings ?? null,
			data.capabilities ?? { files: false, images: false },
			data.variables ?? { pays: "France" },
			data.fewShotExamples ?? [{ user: "Question", assistant: "Réponse" }],
			data.outputFormat ?? "Réponds en sections courtes.",
			data.qualityChecklist ?? ["Réponse claire"],
		);
	}
}

class InMemoryChatRepository {
	private sessions = new Map<string, ChatSessionEntity>();
	private messages = new Map<string, ChatMessageEntity[]>();
	private nextSessionId = 1;
	private nextMessageId = 1;

	async create(userId: string, agentId: string) {
		const session = new ChatSessionEntity(
			`session-${this.nextSessionId++}`,
			userId,
			agentId,
			null,
			new Date(),
			new Date(),
		);
		this.sessions.set(session.id, session);
		this.messages.set(session.id, []);
		return session;
	}

	async findById(id: string) {
		return this.sessions.get(id) ?? null;
	}

	async findByUser(userId: string) {
		const sessions = [...this.sessions.values()].filter((session) => session.userId === userId);
		return {
			sessions: sessions.map((session) =>
				Object.assign(session, {
					agentName: "Agent",
					agentImageUrl: null,
					messageCount: 0,
					lastMessagePreview: null,
				}),
			),
			total: sessions.length,
		};
	}

	async findByUserAndAgent(userId: string, agentId: string) {
		return [...this.sessions.values()].filter(
			(session) => session.userId === userId && session.agentId === agentId,
		);
	}

	async updateTitle(id: string, title: string) {
		const session = this.sessions.get(id);
		if (!session) return;
		this.sessions.set(
			id,
			new ChatSessionEntity(
				id,
				session.userId,
				session.agentId,
				title,
				session.createdAt,
				new Date(),
			),
		);
	}

	async delete(id: string) {
		this.sessions.delete(id);
		this.messages.delete(id);
	}

	async addMessage(sessionId: string, role: string, content: string) {
		const message = new ChatMessageEntity(
			`message-${this.nextMessageId++}`,
			sessionId,
			role,
			"TEXT",
			content,
			null,
			null,
			new Date(),
		);
		this.messages.set(sessionId, [...(this.messages.get(sessionId) ?? []), message]);
		return message;
	}

	async getMessages(sessionId: string) {
		const messages = this.messages.get(sessionId) ?? [];
		return { messages, total: messages.length };
	}

	async countUserMessagesSince() {
		return 0;
	}
}

async function* streamText(): AsyncGenerator<string> {
	yield "Réponse MVP";
}

describe("MVP agent flow (e2e)", () => {
	it("create draft → test draft → submit → admin review/test → approve → public chat", async () => {
		const agentRepo = new InMemoryAgentRepository();
		const chatRepo = new InMemoryChatRepository();
		const strategyResolver = {
			resolve: jest.fn().mockResolvedValue({
				provider: { streamText: jest.fn().mockReturnValue(streamText()) },
				extraParams: {},
			}),
		};
		const prisma = {
			user: {
				findUnique: jest.fn().mockResolvedValue({
					apiKeysEncrypted: [{ provider: "anthropic" }],
				}),
			},
		};
		const quotaService = {
			assertWithinQuota: jest.fn().mockResolvedValue(undefined),
			maxHistoryMessages: 100,
		};
		const activityLog = { log: jest.fn() };
		const knowledgeService = { buildKnowledgeContext: jest.fn().mockResolvedValue(null) };
		const skillContextService = { buildSkillContext: jest.fn().mockResolvedValue(null) };
		const observability = {
			recordMessageStarted: jest.fn(),
			recordProviderSuccess: jest.fn(),
			recordProviderError: jest.fn(),
			recordAssistantMessageSaved: jest.fn(),
		};
		const toolRegistry = {
			prepare: jest.fn().mockResolvedValue({
				definitions: [],
				execute: jest.fn(),
			}),
		};

		const createAgent = new CreateAgentUseCase(
			agentRepo as never,
			{ encrypt: (value: string) => value } as never,
		);
		const validateAgent = new ValidateAgentUseCase(agentRepo as never);
		const submitAgent = new SubmitAgentForReviewUseCase(agentRepo as never, validateAgent);
		const reviewAgent = new ReviewAgentUseCase(agentRepo as never, activityLog as never);
		const chatConfig = new GetAgentChatConfigUseCase(agentRepo as never, prisma as never);
		const createSession = new CreateSessionUseCase(chatRepo as never, agentRepo as never);
		const sendMessage = new SendMessageUseCase(
			chatRepo as never,
			agentRepo as never,
			strategyResolver as never,
			quotaService as never,
			knowledgeService as never,
			skillContextService as never,
			observability as never,
			toolRegistry as never,
		);

		const created = await createAgent.execute(
			{
				name: "Agent MVP",
				slug: "agent-mvp",
				description: "Agent de test MVP",
				category: "productivity",
				tags: ["mvp"],
				models: ["claude-sonnet-4-20250514"],
				mode: "CLOUD",
				cloud_strategy: "USER_API_KEY",
				required_user_provider: "anthropic",
				system_prompt: "Tu aides à valider le parcours MVP.",
				welcome_message: "Bonjour MVP",
				suggested_prompts: ["Teste ce parcours"],
				limitations: ["Pas production"],
				variables: { pays: "France" },
				few_shot_examples: [{ user: "Ping", assistant: "Pong" }],
				output_format: "Réponds court.",
				quality_checklist: ["Clair"],
			},
			"creator-1",
		);
		expect(created.status).toBe("draft");

		await expect(createSession.execute(created.id, "user-1", false)).rejects.toBeInstanceOf(
			BadRequestException,
		);

		const draftSession = await createSession.execute(created.id, "creator-1", true, "USER");
		await sendMessage.execute(draftSession.id, "creator-1", "Test draft", "TEXT", [], [], "USER");
		expect(knowledgeService.buildKnowledgeContext).toHaveBeenCalledWith(created.id, "Test draft");
		expect(skillContextService.buildSkillContext).toHaveBeenCalledWith(created.id, "Test draft");
		expect(observability.recordMessageStarted).toHaveBeenCalled();
		expect(strategyResolver.resolve).toHaveBeenCalledTimes(1);

		const submitResult = await submitAgent.execute(created.id, "creator-1");
		expect(submitResult.valid).toBe(true);
		expect((await agentRepo.findById(created.id))?.status).toBe("PENDING");

		const adminSession = await createSession.execute(created.id, "admin-1", true, "ADMIN");
		await sendMessage.execute(adminSession.id, "admin-1", "Test admin", "TEXT", [], [], "ADMIN");
		expect(strategyResolver.resolve).toHaveBeenCalledTimes(2);

		const review = await reviewAgent.execute(created.id, "approve", undefined, {
			id: "admin-1",
			email: "admin@example.com",
		});
		expect(review.status).toBe("approved");

		const publicConfig = await chatConfig.execute(created.id, {
			id: "user-1",
			email: "user@example.com",
			role: "USER",
		});
		expect(publicConfig.access.can_chat).toBe(true);
		expect(publicConfig.output_format).toBe("Réponds court.");

		const publicSession = await createSession.execute(created.id, "user-1", false, "USER");
		const publicResponse = await sendMessage.execute(
			publicSession.id,
			"user-1",
			"Chat public",
			"TEXT",
			[],
			[],
			"USER",
		);
		expect(publicResponse.stream).toBeDefined();
		expect(strategyResolver.resolve).toHaveBeenCalledTimes(3);
	});
});
