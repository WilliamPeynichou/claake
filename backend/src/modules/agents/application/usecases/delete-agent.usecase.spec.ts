import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ActivityLogService } from "../../../activity/domain/activity-log.service";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { DeleteAgentUseCase } from "./delete-agent.usecase";

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
		overrides.status ?? "DRAFT",
		null, 0, 0, 0,
		overrides.creatorId ?? "user-1",
		null, new Date(), new Date(),
	);
}

const actor = { id: "user-1", email: "user@test.com" };

describe("DeleteAgentUseCase", () => {
	let useCase: DeleteAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				DeleteAgentUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
				{ provide: ActivityLogService, useValue: mockActivityLog },
			],
		}).compile();

		useCase = module.get(DeleteAgentUseCase);
		jest.clearAllMocks();
	});

	it("soft-delete un agent DRAFT du propriétaire", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "DRAFT" }));

		await useCase.execute("agent-1", actor);

		expect(mockRepo.softDelete).toHaveBeenCalledWith("agent-1");
		expect(mockActivityLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: "agent.deleted" }));
	});

	it("soft-delete un agent REJECTED", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "REJECTED" }));

		await useCase.execute("agent-1", actor);

		expect(mockRepo.softDelete).toHaveBeenCalledWith("agent-1");
	});

	it("refuse si l'agent n'existe pas", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("ghost", actor)).rejects.toThrow(NotFoundException);
		expect(mockRepo.softDelete).not.toHaveBeenCalled();
	});

	it("refuse si l'utilisateur n'est pas propriétaire", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ creatorId: "other-owner" }));

		await expect(useCase.execute("agent-1", actor)).rejects.toThrow(ForbiddenException);
		expect(mockRepo.softDelete).not.toHaveBeenCalled();
	});

	it("refuse si l'agent est APPROVED", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "APPROVED" }));

		await expect(useCase.execute("agent-1", actor)).rejects.toThrow(BadRequestException);
		expect(mockRepo.softDelete).not.toHaveBeenCalled();
	});

	it("log l'activité agent.deleted avec le bon metadata", async () => {
		mockRepo.findById.mockResolvedValue(makeAgent({ status: "DRAFT" }));

		await useCase.execute("agent-1", actor);

		expect(mockActivityLog.log).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "agent.deleted",
				targetType: "agent",
				targetId: "agent-1",
				actorId: "user-1",
			}),
		);
	});
});
