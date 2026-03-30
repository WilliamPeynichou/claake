import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ActivityLogService } from "../../../activity/domain/activity-log.service";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { UnpublishAgentUseCase } from "./unpublish-agent.usecase";

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	updateStatus: jest.fn(),
	softDelete: jest.fn(),
};

const mockActivityLog = { log: jest.fn() };

function makeAgent(overrides: { status?: string; creatorId?: string } = {}): AgentEntity {
	return new AgentEntity(
		"agent-1", "My Agent", "my-agent", "desc", null,
		"coding", ["ai"], ["claude-sonnet-4-20250514"], "CLOUD",
		null, null, [], "FREE", 0, 1,
		overrides.status ?? "APPROVED",
		null, 0, 0, 0,
		overrides.creatorId ?? "user-1",
		null, new Date(), new Date(),
	);
}

const actor = { id: "user-1", email: "user@test.com" };

describe("UnpublishAgentUseCase", () => {
	let useCase: UnpublishAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UnpublishAgentUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
				{ provide: ActivityLogService, useValue: mockActivityLog },
			],
		}).compile();

		useCase = module.get(UnpublishAgentUseCase);
		jest.clearAllMocks();
	});

	it("dépublie un agent APPROVED et retourne draft", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "APPROVED" }));

		const result = await useCase.execute("agent-1", actor);

		expect(mockRepo.updateStatus).toHaveBeenCalledWith("agent-1", "DRAFT");
		expect(result.status).toBe("draft");
	});

	it("refuse si l'agent n'existe pas", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("ghost", actor)).rejects.toThrow(NotFoundException);
		expect(mockRepo.updateStatus).not.toHaveBeenCalled();
	});

	it("refuse si l'agent n'est pas APPROVED", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "DRAFT" }));

		await expect(useCase.execute("agent-1", actor)).rejects.toThrow(BadRequestException);
		expect(mockRepo.updateStatus).not.toHaveBeenCalled();
	});

	it("refuse si l'utilisateur n'est pas propriétaire", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ creatorId: "other-owner" }));

		await expect(useCase.execute("agent-1", actor)).rejects.toThrow(ForbiddenException);
	});

	it("log l'activité agent.unpublished", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "APPROVED" }));

		await useCase.execute("agent-1", actor);

		expect(mockActivityLog.log).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "agent.unpublished",
				targetId: "agent-1",
				actorId: "user-1",
			}),
		);
	});
});
