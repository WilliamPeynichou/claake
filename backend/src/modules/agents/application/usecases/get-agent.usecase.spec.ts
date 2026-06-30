import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { GetAgentUseCase } from "./get-agent.usecase";

const mockAgent = new AgentEntity(
	"agent-1",
	"Test Agent",
	"test-agent",
	"Description",
	null,
	"coding",
	["ai"],
	["claude-sonnet-4-20250514"],
	"CLOUD",
	null,
	null,
	[],
	"FREE",
	0,
	1,
	"APPROVED",
	null,
	50,
	4.0,
	5,
	"user-1",
	"Creator",
	new Date("2025-01-01"),
	new Date("2025-01-02"),
);

const mockRepo = {
	findById: jest.fn(),
	findAll: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	updateStatus: jest.fn(),
};

describe("GetAgentUseCase", () => {
	let useCase: GetAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [GetAgentUseCase, { provide: AGENT_REPOSITORY, useValue: mockRepo }],
		}).compile();

		useCase = module.get(GetAgentUseCase);
		jest.clearAllMocks();
	});

	it("returns the agent DTO when found", async () => {
		mockRepo.findById.mockResolvedValue(mockAgent);

		const result = await useCase.execute("agent-1");

		expect(mockRepo.findById).toHaveBeenCalledWith("agent-1");
		expect(result.id).toBe("agent-1");
		expect(result.name).toBe("Test Agent");
		expect(result.slug).toBe("test-agent");
		expect(result.status).toBe("approved");
	});

	it("throws NotFoundException when agent not found", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("nonexistent")).rejects.toThrow(NotFoundException);
	});
});
