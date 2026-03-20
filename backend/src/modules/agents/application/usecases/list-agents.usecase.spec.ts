import { Test } from "@nestjs/testing";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { ListAgentsUseCase } from "./list-agents.usecase";

const mockAgents = [
	new AgentEntity(
		"a1", "Agent 1", "agent-1", "Desc 1", null, "coding", [], ["claude-sonnet-4-20250514"],
		"CLOUD", null, null, [], "FREE", 0, 1, "APPROVED", null, 10, 4.0, 2,
		"u1", "Creator", new Date(), new Date(),
	),
	new AgentEntity(
		"a2", "Agent 2", "agent-2", "Desc 2", null, "writing", [], ["gpt-4o"],
		"CLOUD", null, null, [], "FREE", 0, 1, "APPROVED", null, 20, 3.5, 5,
		"u2", "Creator 2", new Date(), new Date(),
	),
];

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	updateStatus: jest.fn(),
};

describe("ListAgentsUseCase", () => {
	let useCase: ListAgentsUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				ListAgentsUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
			],
		}).compile();

		useCase = module.get(ListAgentsUseCase);
		jest.clearAllMocks();
	});

	it("returns transformed agents list", async () => {
		mockRepo.findAll.mockResolvedValue({ agents: mockAgents, total: 2 });

		const result = await useCase.execute({ publishedOnly: true });

		expect(result.total).toBe(2);
		expect(result.agents).toHaveLength(2);
		expect(result.agents[0].name).toBe("Agent 1");
		expect(result.agents[1].name).toBe("Agent 2");
	});

	it("passes params to repository", async () => {
		mockRepo.findAll.mockResolvedValue({ agents: [], total: 0 });

		await useCase.execute({ q: "search", category: "coding", publishedOnly: true });

		expect(mockRepo.findAll).toHaveBeenCalledWith({
			q: "search",
			category: "coding",
			publishedOnly: true,
		});
	});

	it("returns empty list when no agents", async () => {
		mockRepo.findAll.mockResolvedValue({ agents: [], total: 0 });

		const result = await useCase.execute({});

		expect(result.agents).toEqual([]);
		expect(result.total).toBe(0);
	});
});
