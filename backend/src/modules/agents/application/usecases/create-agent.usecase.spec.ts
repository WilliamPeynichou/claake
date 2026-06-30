import { Test } from "@nestjs/testing";
import { ENCRYPTION_SERVICE } from "../../../../common/ports/encryption.port";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { CreateAgentUseCase } from "./create-agent.usecase";

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	updateStatus: jest.fn(),
};

const mockEncryption = {
	encrypt: jest.fn((value: string) => `encrypted:${value}`),
	decrypt: jest.fn(),
};

describe("CreateAgentUseCase", () => {
	let useCase: CreateAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				CreateAgentUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
				{ provide: ENCRYPTION_SERVICE, useValue: mockEncryption },
			],
		}).compile();

		useCase = module.get(CreateAgentUseCase);
		jest.clearAllMocks();
	});

	it("creates an agent and returns a DTO", async () => {
		const createdEntity = new AgentEntity(
			"new-id",
			"My Agent",
			"my-agent",
			"A description",
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
			"DRAFT",
			null,
			0,
			0,
			0,
			"creator-1",
			null,
			new Date(),
			new Date(),
			"System prompt",
		);
		mockRepo.create.mockResolvedValue(createdEntity);

		const result = await useCase.execute(
			{
				name: "My Agent",
				slug: "my-agent",
				description: "A description",
				category: "coding",
				tags: ["ai"],
				models: ["claude-sonnet-4-20250514"],
				system_prompt: "System prompt",
				cloud_strategy: "USER_API_KEY",
				required_user_provider: "anthropic",
			} as any,
			"creator-1",
		);

		expect(mockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "My Agent",
				slug: "my-agent",
				systemPrompt: "System prompt",
				creatorId: "creator-1",
			}),
		);
		expect(result.id).toBe("new-id");
		expect(result.name).toBe("My Agent");
	});

	it("normalizes mode to uppercase", async () => {
		mockRepo.create.mockResolvedValue(
			new AgentEntity(
				"id",
				"n",
				"s",
				"d",
				null,
				"c",
				[],
				[],
				"CLOUD",
				null,
				null,
				[],
				"FREE",
				0,
				1,
				"DRAFT",
				null,
				0,
				0,
				0,
				"u",
				null,
				new Date(),
				new Date(),
			),
		);

		await useCase.execute(
			{
				name: "n",
				slug: "s",
				description: "d",
				category: "c",
				tags: [],
				models: [],
				mode: "cloud",
				cloud_strategy: "USER_API_KEY",
				required_user_provider: "anthropic",
			} as any,
			"u",
		);

		expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "CLOUD" }));
	});
});
