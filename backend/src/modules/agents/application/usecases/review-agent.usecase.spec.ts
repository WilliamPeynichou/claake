import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ActivityLogService } from "../../../activity/domain/activity-log.service";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { ReviewAgentUseCase } from "./review-agent.usecase";

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	updateStatus: jest.fn(),
};

const mockActivityLog = {
	log: jest.fn(),
};

function makeAgent(status = "PENDING"): AgentEntity {
	return new AgentEntity(
		"agent-1",
		"Test Agent",
		"test-agent",
		"Desc",
		null,
		"coding",
		[],
		["claude-sonnet-4-20250514"],
		"CLOUD",
		null,
		null,
		[],
		"FREE",
		0,
		1,
		status,
		null,
		0,
		0,
		0,
		"user-1",
		null,
		new Date(),
		new Date(),
	);
}

describe("ReviewAgentUseCase", () => {
	let useCase: ReviewAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				ReviewAgentUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
				{ provide: ActivityLogService, useValue: mockActivityLog },
			],
		}).compile();

		useCase = module.get(ReviewAgentUseCase);
		jest.clearAllMocks();
	});

	it("throws NotFoundException for unknown agent", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("x", "approve")).rejects.toThrow(NotFoundException);
	});

	it("throws BadRequestException for non-PENDING agent", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent("APPROVED"));

		await expect(useCase.execute("agent-1", "approve")).rejects.toThrow(BadRequestException);
	});

	it("approves a pending agent", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent("PENDING"));

		const result = await useCase.execute("agent-1", "approve");

		expect(result.status).toBe("approved");
		expect(mockRepo.updateStatus).toHaveBeenCalledWith("agent-1", "APPROVED", "PASSED");
	});

	it("rejects a pending agent with reason", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent("PENDING"));

		const result = await useCase.execute("agent-1", "reject", "Inappropriate content");

		expect(result.status).toBe("rejected");
		expect(result.reason).toBe("Inappropriate content");
		expect(mockRepo.updateStatus).toHaveBeenCalledWith("agent-1", "REJECTED");
	});
});
