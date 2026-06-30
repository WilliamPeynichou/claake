import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ENCRYPTION_SERVICE } from "../../../../common/ports/encryption.port";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { UpdateAgentUseCase } from "./update-agent.usecase";

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	findBySlug: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	updateStatus: jest.fn(),
	softDelete: jest.fn(),
};

const mockEncryption = {
	encrypt: jest.fn().mockReturnValue("encrypted-key"),
	decrypt: jest.fn(),
};

function makeAgent(
	overrides: { id?: string; status?: string; creatorId?: string; mode?: string } = {},
): AgentEntity {
	return new AgentEntity(
		overrides.id ?? "agent-1",
		"My Agent",
		"my-agent",
		"A description",
		null,
		"coding",
		["ai"],
		["claude-sonnet-4-20250514"],
		overrides.mode ?? "CLOUD",
		null,
		null,
		[],
		"FREE",
		0,
		1,
		overrides.status ?? "DRAFT",
		null,
		0,
		0,
		0,
		overrides.creatorId ?? "user-1",
		null,
		new Date(),
		new Date(),
	);
}

describe("UpdateAgentUseCase", () => {
	let useCase: UpdateAgentUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UpdateAgentUseCase,
				{ provide: AGENT_REPOSITORY, useValue: mockRepo },
				{ provide: ENCRYPTION_SERVICE, useValue: mockEncryption },
			],
		}).compile();

		useCase = module.get(UpdateAgentUseCase);
		jest.clearAllMocks();
	});

	it("met à jour un agent DRAFT du propriétaire", async () => {
		const agent = makeAgent({ status: "DRAFT" });
		const updated = makeAgent({ status: "DRAFT" });
		mockRepo.findById.mockResolvedValue(agent);
		mockRepo.update.mockResolvedValue(updated);

		const result = await useCase.execute("agent-1", { name: "New Name" }, "user-1");

		expect(mockRepo.update).toHaveBeenCalledWith(
			"agent-1",
			expect.objectContaining({ name: "New Name" }),
		);
		expect(result.id).toBe("agent-1");
	});

	it("met à jour un agent REJECTED du propriétaire", async () => {
		const agent = makeAgent({ status: "REJECTED" });
		const updated = makeAgent({ status: "REJECTED" });
		mockRepo.findById.mockResolvedValue(agent);
		mockRepo.update.mockResolvedValue(updated);

		await useCase.execute("agent-1", { description: "Updated" }, "user-1");

		expect(mockRepo.update).toHaveBeenCalled();
	});

	it("refuse si l'agent n'existe pas", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute("ghost", {}, "user-1")).rejects.toThrow(NotFoundException);
		expect(mockRepo.update).not.toHaveBeenCalled();
	});

	it("refuse si l'utilisateur n'est pas propriétaire", async () => {
		const agent = makeAgent({ creatorId: "owner-1" });
		mockRepo.findById.mockResolvedValue(agent);

		await expect(useCase.execute("agent-1", {}, "other-user")).rejects.toThrow(ForbiddenException);
	});

	it("refuse si l'agent est APPROVED", async () => {
		const agent = makeAgent({ status: "APPROVED" });
		mockRepo.findById.mockResolvedValue(agent);

		await expect(useCase.execute("agent-1", {}, "user-1")).rejects.toThrow(BadRequestException);
	});

	it("refuse si l'agent est PENDING", async () => {
		const agent = makeAgent({ status: "PENDING" });
		mockRepo.findById.mockResolvedValue(agent);

		await expect(useCase.execute("agent-1", {}, "user-1")).rejects.toThrow(BadRequestException);
	});

	it("chiffre la seller_api_key si fournie", async () => {
		const agent = makeAgent({ status: "DRAFT" });
		const updated = makeAgent();
		mockRepo.findById.mockResolvedValue(agent);
		mockRepo.update.mockResolvedValue(updated);

		await useCase.execute("agent-1", { seller_api_key: "sk-raw-key" }, "user-1");

		expect(mockEncryption.encrypt).toHaveBeenCalledWith("sk-raw-key");
		expect(mockRepo.update).toHaveBeenCalledWith(
			"agent-1",
			expect.objectContaining({ sellerApiKeyEncrypted: "encrypted-key" }),
		);
	});

	it("met à null sellerApiKeyEncrypted si seller_api_key vide", async () => {
		const agent = makeAgent({ status: "DRAFT" });
		const updated = makeAgent();
		mockRepo.findById.mockResolvedValue(agent);
		mockRepo.update.mockResolvedValue(updated);

		await useCase.execute("agent-1", { seller_api_key: "" }, "user-1");

		expect(mockEncryption.encrypt).not.toHaveBeenCalled();
		expect(mockRepo.update).toHaveBeenCalledWith(
			"agent-1",
			expect.objectContaining({ sellerApiKeyEncrypted: null }),
		);
	});

	it("normalise le mode en majuscules", async () => {
		const agent = makeAgent({ status: "DRAFT" });
		const updated = makeAgent();
		mockRepo.findById.mockResolvedValue(agent);
		mockRepo.update.mockResolvedValue(updated);

		await useCase.execute("agent-1", { mode: "cloud" as any }, "user-1");

		expect(mockRepo.update).toHaveBeenCalledWith(
			"agent-1",
			expect.objectContaining({ mode: "CLOUD" }),
		);
	});
});
