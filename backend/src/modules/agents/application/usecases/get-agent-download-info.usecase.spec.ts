import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { GetAgentDownloadInfoUseCase } from "./get-agent-download-info.usecase";

const repo = {
	findById: jest.fn(),
	hasPurchased: jest.fn(),
	hasActiveSubscription: jest.fn(),
};

function makeAgent(overrides: { status?: string; pricingModel?: string; creatorId?: string } = {}) {
	return new AgentEntity(
		"agent-1",
		"Local Agent",
		"local-agent",
		"desc",
		null,
		"coding",
		[],
		["gpt-4o"],
		"LOCAL",
		null,
		null,
		[],
		overrides.pricingModel ?? "ONE_TIME",
		10,
		1,
		overrides.status ?? "APPROVED",
		null,
		0,
		0,
		0,
		overrides.creatorId ?? "creator-1",
		null,
		new Date(),
		new Date(),
		"secret system prompt",
		null,
		null,
		null,
		null,
		null,
		null,
		"registry.example/agent:1",
		"https://download.example/agent.tar.gz",
	);
}

describe("GetAgentDownloadInfoUseCase", () => {
	let useCase: GetAgentDownloadInfoUseCase;

	beforeEach(() => {
		jest.clearAllMocks();
		repo.hasPurchased.mockResolvedValue(false);
		repo.hasActiveSubscription.mockResolvedValue(false);
		useCase = new GetAgentDownloadInfoUseCase(repo as any);
	});

	it("refuse download-info pour un agent non publié si l'utilisateur n'est pas propriétaire", async () => {
		repo.findById.mockResolvedValue(makeAgent({ status: "SUSPENDED" }));

		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(BadRequestException);
	});

	it("autorise le propriétaire à consulter un agent non publié", async () => {
		repo.findById.mockResolvedValue(makeAgent({ status: "DRAFT", creatorId: "user-1" }));

		await expect(useCase.execute("agent-1", "user-1")).resolves.toEqual(
			expect.objectContaining({
				docker_image: "registry.example/agent:1",
				download_url: "https://download.example/agent.tar.gz",
				system_prompt: "secret system prompt",
			}),
		);
	});

	it("exige un achat ou abonnement actif pour un agent payant publié", async () => {
		repo.findById.mockResolvedValue(makeAgent());

		await expect(useCase.execute("agent-1", "user-1")).rejects.toBeInstanceOf(ForbiddenException);
	});
});
