import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { SubmitAgentForReviewUseCase } from "./submit-agent-for-review.usecase";
import { ValidateAgentUseCase } from "./validate-agent.usecase";

function makeAgent(status = "DRAFT", creatorId = "user-1") {
	return new AgentEntity(
		"agent-1",
		"Agent",
		"agent",
		"Description",
		null,
		"productivity",
		[],
		["gpt-4o"],
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
		creatorId,
		null,
		new Date(),
		new Date(),
	);
}

describe("SubmitAgentForReviewUseCase", () => {
	const repo = { findById: jest.fn() };
	const validateAgent = { execute: jest.fn() };
	let useCase: SubmitAgentForReviewUseCase;

	beforeEach(async () => {
		jest.clearAllMocks();
		const moduleRef = await Test.createTestingModule({
			providers: [
				SubmitAgentForReviewUseCase,
				{ provide: AGENT_REPOSITORY, useValue: repo },
				{ provide: ValidateAgentUseCase, useValue: validateAgent },
			],
		}).compile();
		useCase = moduleRef.get(SubmitAgentForReviewUseCase);
		validateAgent.execute.mockResolvedValue({
			valid: true,
			errors: [],
			warnings: [],
			requiresManualReview: false,
		});
	});

	it("soumet un brouillon du propriétaire", async () => {
		repo.findById.mockResolvedValue(makeAgent("DRAFT"));

		await expect(useCase.execute("agent-1", "user-1")).resolves.toMatchObject({ valid: true });
		expect(validateAgent.execute).toHaveBeenCalledWith("agent-1");
	});

	it("soumet un agent rejeté du propriétaire", async () => {
		repo.findById.mockResolvedValue(makeAgent("REJECTED"));

		await expect(useCase.execute("agent-1", "user-1")).resolves.toMatchObject({ valid: true });
	});

	it("refuse si l'agent est introuvable", async () => {
		repo.findById.mockResolvedValue(null);

		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
	});

	it("refuse si l'utilisateur n'est pas propriétaire", async () => {
		repo.findById.mockResolvedValue(makeAgent("DRAFT", "other-user"));

		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(ForbiddenException);
	});

	it("refuse un agent déjà pending ou approved", async () => {
		repo.findById.mockResolvedValue(makeAgent("PENDING"));
		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);

		repo.findById.mockResolvedValue(makeAgent("APPROVED"));
		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);
	});
});
