import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AgentKnowledgeService } from "../../../agents/application/services/agent-knowledge.service";
import { AgentSkillContextService } from "../../../agents/application/services/agent-skill-context.service";
import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../../agents/domain/ports/agent.repository.port";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import { CHAT_SESSION_REPOSITORY } from "../../domain/ports/chat-session.repository.port";
import { ChatObservabilityService } from "../services/chat-observability.service";
import { ChatQuotaService } from "../services/chat-quota.service";
import { EXECUTION_STRATEGY_RESOLVER } from "../services/execution-strategy.resolver";
import { ToolRegistryService } from "../services/tool-registry.service";
import { SendMessageUseCase } from "./send-message.usecase";

async function* mockStream(): AsyncGenerator<string> {
	yield "Bonjour ";
	yield "monde!";
}

const mockProvider = { streamText: jest.fn() };

const mockChatRepo = {
	create: jest.fn(),
	findById: jest.fn(),
	findByUser: jest.fn(),
	findByUserAndAgent: jest.fn(),
	updateTitle: jest.fn(),
	delete: jest.fn(),
	addMessage: jest.fn(),
	getMessages: jest.fn(),
	countUserMessagesSince: jest.fn(),
};

const mockAgentRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	updateStatus: jest.fn(),
	softDelete: jest.fn(),
	hasPurchased: jest.fn(),
	hasActiveSubscription: jest.fn(),
};

const mockStrategyResolver = { resolve: jest.fn() };
const mockObservability = {
	recordMessageStarted: jest.fn(),
	recordProviderSuccess: jest.fn(),
	recordProviderError: jest.fn(),
	recordAssistantMessageSaved: jest.fn(),
};
const mockToolRegistry = {
	getDefinitions: jest.fn().mockReturnValue([]),
	execute: jest.fn(),
	prepare: jest.fn(),
};

function makeSession(
	overrides: { title?: string | null; userId?: string } = {},
): ChatSessionEntity {
	return new ChatSessionEntity(
		"session-1",
		overrides.userId ?? "user-1",
		"agent-1",
		overrides.title !== undefined ? overrides.title : null,
		new Date(),
		new Date(),
	);
}

function makeAgent(
	overrides: {
		models?: string[];
		systemPrompt?: string | null;
		variables?: Record<string, unknown> | null;
		fewShotExamples?: Record<string, unknown>[];
		outputFormat?: string | null;
		status?: string;
		pricingModel?: string;
		creatorId?: string;
		tools?: any[];
	} = {},
): AgentEntity {
	return new AgentEntity(
		"agent-1",
		"My Agent",
		"my-agent",
		"desc",
		null,
		"coding",
		["ai"],
		overrides.models ?? ["claude-sonnet-4-20250514"],
		"CLOUD",
		null,
		null,
		[],
		overrides.pricingModel ?? "FREE",
		0,
		1,
		overrides.status ?? "APPROVED",
		null,
		0,
		0,
		0,
		overrides.creatorId ?? "creator-1",
		null,
		new Date(),
		new Date(),
		overrides.systemPrompt ?? "You are a helpful assistant",
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		[],
		[],
		null,
		null,
		overrides.variables ?? null,
		overrides.fewShotExamples ?? [],
		overrides.outputFormat ?? null,
		[],
		overrides.tools ?? [],
	);
}

describe("SendMessageUseCase", () => {
	let useCase: SendMessageUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				SendMessageUseCase,
				{ provide: CHAT_SESSION_REPOSITORY, useValue: mockChatRepo },
				{ provide: AGENT_REPOSITORY, useValue: mockAgentRepo },
				{ provide: EXECUTION_STRATEGY_RESOLVER, useValue: mockStrategyResolver },
				ChatQuotaService,
				{ provide: ChatObservabilityService, useValue: mockObservability },
				{ provide: ToolRegistryService, useValue: mockToolRegistry },
				{
					provide: AgentSkillContextService,
					useValue: { buildSkillContext: jest.fn().mockResolvedValue(null) },
				},
				{
					provide: AgentKnowledgeService,
					useValue: { buildKnowledgeContext: jest.fn().mockResolvedValue(null) },
				},
			],
		}).compile();

		useCase = module.get(SendMessageUseCase);
		jest.clearAllMocks();

		mockToolRegistry.prepare.mockImplementation(async (_agent, context) => ({
			definitions: mockToolRegistry.getDefinitions(),
			execute: (name: string, input: unknown, callIndex: number) =>
				mockToolRegistry.execute(name, input, context, callIndex),
		}));
		mockProvider.streamText.mockReturnValue(mockStream());
		delete (mockProvider as any).streamEvents;
		mockStrategyResolver.resolve.mockResolvedValue({ provider: mockProvider, extraParams: {} });
		mockChatRepo.addMessage.mockResolvedValue({ id: "msg-1", role: "USER", content: "hello" });
		mockChatRepo.getMessages.mockResolvedValue({ messages: [], total: 0 });
		mockChatRepo.countUserMessagesSince.mockResolvedValue(0);
		mockAgentRepo.hasPurchased.mockResolvedValue(false);
		mockAgentRepo.hasActiveSubscription.mockResolvedValue(false);
	});

	it("retourne un stream et un onComplete callable", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		const result = await useCase.execute("session-1", "user-1", "Bonjour");

		expect(result.stream).toBeDefined();
		expect(typeof result.onComplete).toBe("function");
	});

	it("sauvegarde le message utilisateur en DB", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute("session-1", "user-1", "Mon message");

		expect(mockChatRepo.addMessage).toHaveBeenCalledWith(
			"session-1",
			"USER",
			"Mon message",
			"TEXT",
			null,
			null,
			[],
		);
	});

	it("rattache les fichiers au message utilisateur", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute(
			"session-1",
			"user-1",
			"Analyse ce document",
			"TEXT",
			[{ type: "document", url: "https://files.example/doc.pdf", mimeType: "application/pdf" }],
			["file-1"],
		);

		expect(mockChatRepo.addMessage).toHaveBeenCalledWith(
			"session-1",
			"USER",
			"Analyse ce document",
			"TEXT",
			null,
			null,
			["file-1"],
		);
		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				attachments: [
					{ type: "document", url: "https://files.example/doc.pdf", mimeType: "application/pdf" },
				],
			}),
		);
	});

	it("génère un titre à la première message si aucun titre existant", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession({ title: null }));
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute("session-1", "user-1", "Quelle est la météo ?");

		expect(mockChatRepo.updateTitle).toHaveBeenCalledWith("session-1", "Quelle est la météo ?");
	});

	it("bloque et n'écrit rien si le quota par minute est dépassé", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());
		mockChatRepo.countUserMessagesSince.mockResolvedValue(9999);

		await expect(useCase.execute("session-1", "user-1", "Salut")).rejects.toMatchObject({
			status: 429,
		});
		expect(mockChatRepo.addMessage).not.toHaveBeenCalled();
	});

	it("ne génère pas de titre si la session en a déjà un", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession({ title: "Titre existant" }));
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute("session-1", "user-1", "Nouveau message");

		expect(mockChatRepo.updateTitle).not.toHaveBeenCalled();
	});

	it("charge les 100 derniers messages d'historique", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute("session-1", "user-1", "Question");

		expect(mockChatRepo.getMessages).toHaveBeenCalledWith("session-1", 100, 0);
	});

	it("résout la stratégie d'exécution via le resolver", async () => {
		const session = makeSession();
		const agent = makeAgent();
		mockChatRepo.findById.mockResolvedValue(session);
		mockAgentRepo.findById.mockResolvedValue(agent);

		await useCase.execute("session-1", "user-1", "Bonjour");

		expect(mockStrategyResolver.resolve).toHaveBeenCalledWith(agent, "user-1");
	});

	it("utilise le premier modèle de l'agent", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ models: ["gpt-4o", "gpt-3.5-turbo"] }));

		await useCase.execute("session-1", "user-1", "Hello");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({ model: "gpt-4o" }),
		);
	});

	it("fallback sur claude-sonnet-4-20250514 si aucun modèle défini", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ models: [] }));

		await useCase.execute("session-1", "user-1", "Hello");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({ model: "claude-sonnet-4-20250514" }),
		);
	});

	it("passe le systemPrompt de l'agent au provider", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(
			makeAgent({ systemPrompt: "Tu es un expert en droit." }),
		);

		await useCase.execute("session-1", "user-1", "Question juridique");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({ systemPrompt: "Tu es un expert en droit." }),
		);
	});

	it("passe le systemPrompt enrichi qualité au provider", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(
			makeAgent({
				systemPrompt: "Tu es un expert en droit.",
				variables: { pays: "France", niveau: "expert" },
				fewShotExamples: [{ user: "Analyse cette clause", assistant: "Résumé / Risques" }],
				outputFormat: "Réponds en sections.",
			}),
		);

		await useCase.execute("session-1", "user-1", "Question juridique");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				systemPrompt: expect.stringContaining("Variables agent"),
			}),
		);
		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				systemPrompt: expect.stringContaining("Exemples few-shot"),
			}),
		);
		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				systemPrompt: expect.stringContaining("Format de sortie attendu"),
			}),
		);
	});

	it("injecte les skills sélectionnés dans le system prompt", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());
		const skillContext = "## Skill: Juridique\nFichier: clause.md\n\nUne clause utile";
		const module = await Test.createTestingModule({
			providers: [
				SendMessageUseCase,
				{ provide: CHAT_SESSION_REPOSITORY, useValue: mockChatRepo },
				{ provide: AGENT_REPOSITORY, useValue: mockAgentRepo },
				{ provide: EXECUTION_STRATEGY_RESOLVER, useValue: mockStrategyResolver },
				ChatQuotaService,
				{ provide: ChatObservabilityService, useValue: mockObservability },
				{ provide: ToolRegistryService, useValue: mockToolRegistry },
				{ provide: AgentKnowledgeService, useValue: { buildKnowledgeContext: jest.fn() } },
				{
					provide: AgentSkillContextService,
					useValue: { buildSkillContext: jest.fn().mockResolvedValue(skillContext) },
				},
			],
		}).compile();

		await module.get(SendMessageUseCase).execute("session-1", "user-1", "Question");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({ systemPrompt: expect.stringContaining("Skills pertinents") }),
		);
	});

	it("trace le démarrage et le succès provider quand le stream est consommé", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ models: ["mock"] }));

		const { stream } = await useCase.execute("session-1", "user-1", "Bonjour");
		const chunks: string[] = [];
		for await (const event of stream) {
			if (event.type === "text") chunks.push(event.delta);
		}

		expect(chunks.join("")).toBe("Bonjour monde!");
		expect(mockObservability.recordMessageStarted).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionId: "session-1",
				agentId: "agent-1",
				userId: "user-1",
				model: "mock",
				contentLength: 7,
			}),
		);
		expect(mockObservability.recordProviderSuccess).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionId: "session-1",
				agentId: "agent-1",
				outputLength: 14,
			}),
		);
	});

	it("trace les erreurs provider quand le stream échoue", async () => {
		async function* failingStream(): AsyncGenerator<string> {
			yield "Début";
			throw new Error("provider_down");
		}
		mockProvider.streamText.mockReturnValue(failingStream());
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		const { stream } = await useCase.execute("session-1", "user-1", "Bonjour");

		await expect(async () => {
			for await (const _chunk of stream) {
				// consume stream
			}
		}).rejects.toThrow("provider_down");
		expect(mockObservability.recordProviderError).toHaveBeenCalledWith(
			expect.objectContaining({ error: "provider_down", outputLength: 5 }),
		);
	});

	it("onComplete sauvegarde la réponse de l'assistant", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());
		mockChatRepo.addMessage.mockResolvedValue({
			id: "msg-2",
			role: "ASSISTANT",
			content: "Réponse",
		});

		const { onComplete } = await useCase.execute("session-1", "user-1", "Bonjour");
		await onComplete("Réponse de l'IA");

		expect(mockChatRepo.addMessage).toHaveBeenCalledWith(
			"session-1",
			"ASSISTANT",
			"Réponse de l'IA",
			"TEXT",
			null,
			null,
		);
		expect(mockObservability.recordAssistantMessageSaved).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionId: "session-1",
				agentId: "agent-1",
				outputLength: 15,
			}),
		);
	});

	it("forward les tool events provider et exécute via callback backend", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(
			makeAgent({ tools: [{ name: "current_datetime", enabled: true }] }),
		);
		mockToolRegistry.getDefinitions.mockReturnValue([
			{ name: "current_datetime", description: "Date", inputSchema: { type: "object" } },
		]);
		mockToolRegistry.execute.mockResolvedValue({ iso: "2026-07-09T12:00:00.000Z" });
		(mockProvider as any).streamEvents = jest.fn(async function* (params) {
			const call = { id: "tool-1", name: "current_datetime", input: {} };
			yield { type: "tool_call", ...call };
			const output = await params.executeTool(call);
			yield { type: "tool_result", id: call.id, name: call.name, output };
			yield { type: "text", delta: "Done" };
			yield { type: "done" };
		});

		const result = await useCase.execute("session-1", "user-1", "Quelle heure ?");
		const events = [];
		for await (const event of result.stream) events.push(event);

		expect(mockToolRegistry.prepare).toHaveBeenCalledWith(
			expect.objectContaining({ id: "agent-1" }),
			expect.objectContaining({ userId: "user-1", sessionId: "session-1" }),
		);
		expect(mockToolRegistry.execute).toHaveBeenCalledWith(
			"current_datetime",
			{},
			expect.objectContaining({ userId: "user-1", sessionId: "session-1" }),
			0,
		);
		expect(events).toEqual([
			{ type: "tool_call", id: "tool-1", name: "current_datetime", input: {} },
			{
				type: "tool_result",
				id: "tool-1",
				name: "current_datetime",
				output: { iso: "2026-07-09T12:00:00.000Z" },
			},
			{ type: "text", delta: "Done" },
			{ type: "done" },
		]);

		await result.onComplete("Done");
		expect(mockChatRepo.addMessage).toHaveBeenCalledWith(
			"session-1",
			"ASSISTANT",
			"Done",
			"TEXT",
			null,
			{
				toolEvents: [
					{ type: "tool_call", id: "tool-1", name: "current_datetime", payload: "{}" },
					{
						type: "tool_result",
						id: "tool-1",
						name: "current_datetime",
						payload: JSON.stringify({ iso: "2026-07-09T12:00:00.000Z" }),
					},
				],
			},
		);
	});

	it("refuse le 6e tool call provider via quota registry", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(
			makeAgent({ tools: [{ name: "current_datetime", enabled: true }] }),
		);
		mockToolRegistry.getDefinitions.mockReturnValue([
			{ name: "current_datetime", description: "Date", inputSchema: { type: "object" } },
		]);
		mockToolRegistry.execute.mockImplementation((_name, _input, _context, callIndex) => {
			if (callIndex >= 5) throw new Error("Tool call quota exceeded for this message");
			return { ok: true };
		});
		(mockProvider as any).streamEvents = jest.fn(async function* (params) {
			for (let index = 0; index < 6; index++) {
				const call = { id: `tool-${index}`, name: "current_datetime", input: {} };
				yield { type: "tool_call", ...call };
				await params.executeTool(call);
			}
		});

		const result = await useCase.execute("session-1", "user-1", "spam tools");
		await expect(async () => {
			for await (const _event of result.stream) {
				// consume stream
			}
		}).rejects.toThrow("Tool call quota exceeded for this message");
	});

	it("refuse si la session n'existe pas", async () => {
		mockChatRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("ghost-session", "user-1", "Hello")).rejects.toThrow(
			NotFoundException,
		);
	});

	it("refuse si l'utilisateur ne possède pas la session", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession({ userId: "other-user" }));

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(
			ForbiddenException,
		);
	});

	it("refuse si l'agent n'existe plus", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(
			NotFoundException,
		);
	});

	it("refuse d'envoyer un message si l'agent de la session n'est plus publié", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ status: "SUSPENDED" }));

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(
			"This agent is not available",
		);
		expect(mockChatRepo.addMessage).not.toHaveBeenCalled();
	});

	it("revérifie l'achat ou l'abonnement à chaque message pour un agent payant", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ pricingModel: "ONE_TIME" }));

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(
			ForbiddenException,
		);
		expect(mockAgentRepo.hasPurchased).toHaveBeenCalledWith("user-1", "agent-1");
		expect(mockAgentRepo.hasActiveSubscription).toHaveBeenCalledWith("user-1", "agent-1");
		expect(mockChatRepo.addMessage).not.toHaveBeenCalled();
	});

	it("autorise un agent payant si l'achat est encore actif au moment du message", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ pricingModel: "ONE_TIME" }));
		mockAgentRepo.hasPurchased.mockResolvedValue(true);

		await useCase.execute("session-1", "user-1", "Hello");

		expect(mockChatRepo.addMessage).toHaveBeenCalled();
	});
});
