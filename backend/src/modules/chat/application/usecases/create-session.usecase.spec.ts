import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../../agents/domain/ports/agent.repository.port";
import { ChatSessionEntity } from "../../domain/entities/chat-session.entity";
import { CHAT_SESSION_REPOSITORY } from "../../domain/ports/chat-session.repository.port";
import { CreateSessionUseCase } from "./create-session.usecase";

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
	updateStatus: jest.fn(),
};

describe("CreateSessionUseCase", () => {
	let useCase: CreateSessionUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				CreateSessionUseCase,
				{ provide: CHAT_SESSION_REPOSITORY, useValue: mockChatRepo },
				{ provide: AGENT_REPOSITORY, useValue: mockAgentRepo },
			],
		}).compile();

		useCase = module.get(CreateSessionUseCase);
		jest.clearAllMocks();
	});

	it("creates a session when agent exists", async () => {
		const agent = new AgentEntity(
			"agent-1",
			"Agent",
			"agent",
			"desc",
			null,
			"cat",
			[],
			[],
			"CLOUD",
			null,
			null,
			[],
			"FREE",
			0,
			1,
			"APPROVED",
			null,
			0,
			0,
			0,
			"u1",
			null,
			new Date(),
			new Date(),
		);
		const session = new ChatSessionEntity(
			"session-1",
			"user-1",
			"agent-1",
			null,
			new Date(),
			new Date(),
		);

		mockAgentRepo.findById.mockResolvedValue(agent);
		mockChatRepo.create.mockResolvedValue(session);

		const result = await useCase.execute("agent-1", "user-1");

		expect(result.id).toBe("session-1");
		expect(mockChatRepo.create).toHaveBeenCalledWith("user-1", "agent-1");
	});

	it("throws NotFoundException when agent does not exist", async () => {
		mockAgentRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("nonexistent", "user-1")).rejects.toThrow(NotFoundException);
		expect(mockChatRepo.create).not.toHaveBeenCalled();
	});
});
