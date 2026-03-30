import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../../agents/domain/ports/agent.repository.port";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import { CHAT_SESSION_REPOSITORY } from "../../domain/ports/chat-session.repository.port";
import { EXECUTION_STRATEGY_RESOLVER } from "../services/execution-strategy.resolver";
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
};

const mockAgentRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	updateStatus: jest.fn(),
	softDelete: jest.fn(),
};

const mockStrategyResolver = { resolve: jest.fn() };

function makeSession(overrides: { title?: string | null; userId?: string } = {}): ChatSessionEntity {
	return new ChatSessionEntity(
		"session-1",
		overrides.userId ?? "user-1",
		"agent-1",
		overrides.title !== undefined ? overrides.title : null,
		new Date(), new Date(),
	);
}

function makeAgent(overrides: { models?: string[]; systemPrompt?: string | null } = {}): AgentEntity {
	return new AgentEntity(
		"agent-1", "My Agent", "my-agent", "desc", null,
		"coding", ["ai"],
		overrides.models ?? ["claude-sonnet-4-20250514"],
		"CLOUD", null, null, [], "FREE", 0, 1, "APPROVED",
		null, 0, 0, 0, "creator-1", null, new Date(), new Date(),
		overrides.systemPrompt ?? "You are a helpful assistant",
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
			],
		}).compile();

		useCase = module.get(SendMessageUseCase);
		jest.clearAllMocks();

		mockProvider.streamText.mockReturnValue(mockStream());
		mockStrategyResolver.resolve.mockResolvedValue({ provider: mockProvider, extraParams: {} });
		mockChatRepo.addMessage.mockResolvedValue({ id: "msg-1", role: "USER", content: "hello" });
		mockChatRepo.getMessages.mockResolvedValue({ messages: [], total: 0 });
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

		expect(mockChatRepo.addMessage).toHaveBeenCalledWith("session-1", "USER", "Mon message", "TEXT");
	});

	it("génère un titre à la première message si aucun titre existant", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession({ title: null }));
		mockAgentRepo.findById.mockResolvedValue(makeAgent());

		await useCase.execute("session-1", "user-1", "Quelle est la météo ?");

		expect(mockChatRepo.updateTitle).toHaveBeenCalledWith("session-1", "Quelle est la météo ?");
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

		expect(mockProvider.streamText).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o" }));
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
		mockAgentRepo.findById.mockResolvedValue(makeAgent({ systemPrompt: "Tu es un expert en droit." }));

		await useCase.execute("session-1", "user-1", "Question juridique");

		expect(mockProvider.streamText).toHaveBeenCalledWith(
			expect.objectContaining({ systemPrompt: "Tu es un expert en droit." }),
		);
	});

	it("onComplete sauvegarde la réponse de l'assistant", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(makeAgent());
		mockChatRepo.addMessage.mockResolvedValue({ id: "msg-2", role: "ASSISTANT", content: "Réponse" });

		const { onComplete } = await useCase.execute("session-1", "user-1", "Bonjour");
		await onComplete("Réponse de l'IA");

		expect(mockChatRepo.addMessage).toHaveBeenCalledWith("session-1", "ASSISTANT", "Réponse de l'IA");
	});

	it("refuse si la session n'existe pas", async () => {
		mockChatRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("ghost-session", "user-1", "Hello")).rejects.toThrow(NotFoundException);
	});

	it("refuse si l'utilisateur ne possède pas la session", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession({ userId: "other-user" }));

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(ForbiddenException);
	});

	it("refuse si l'agent n'existe plus", async () => {
		mockChatRepo.findById.mockResolvedValue(makeSession());
		mockAgentRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("session-1", "user-1", "Hello")).rejects.toThrow(NotFoundException);
	});
});
