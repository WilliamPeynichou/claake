import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../../prisma/prisma.service";
import { AgentEntity } from "../../domain/entities/agent.entity";
import { AGENT_REPOSITORY } from "../../domain/ports/agent.repository.port";
import { GetAgentChatConfigUseCase } from "./get-agent-chat-config.usecase";

function makeAgent(overrides: Record<number, unknown> = {}): AgentEntity {
	const defaults: ConstructorParameters<typeof AgentEntity> = [
		"agent-1",
		"Juriste IA",
		"juriste-ia",
		"Analyse les contrats",
		null,
		"legal",
		["contrat"],
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
		0,
		0,
		0,
		"creator-1",
		"Créateur",
		new Date("2026-01-01T00:00:00.000Z"),
		new Date("2026-01-01T00:00:00.000Z"),
		"System prompt",
		"USER_API_KEY",
		null,
		null,
		null,
		null,
		"anthropic",
		null,
		null,
		"Bonjour",
		["Analyse ce contrat"],
		["Ne remplace pas un avocat"],
		null,
		{ files: true, images: false },
	];
	return new AgentEntity(
		...(defaults.map((value, index) =>
			index in overrides ? overrides[index] : value,
		) as ConstructorParameters<typeof AgentEntity>),
	);
}

describe("GetAgentChatConfigUseCase", () => {
	const repo = {
		findById: jest.fn(),
		hasPurchased: jest.fn(),
		hasActiveSubscription: jest.fn(),
	};
	const prisma = {
		user: {
			findUnique: jest.fn(),
		},
	};
	let useCase: GetAgentChatConfigUseCase;

	beforeEach(async () => {
		jest.clearAllMocks();
		const moduleRef = await Test.createTestingModule({
			providers: [
				GetAgentChatConfigUseCase,
				{ provide: AGENT_REPOSITORY, useValue: repo },
				{ provide: PrismaService, useValue: prisma },
			],
		}).compile();
		useCase = moduleRef.get(GetAgentChatConfigUseCase);
	});

	it("renvoie login_required sans utilisateur", async () => {
		repo.findById.mockResolvedValue(makeAgent());

		await expect(useCase.execute("agent-1")).resolves.toMatchObject({
			id: "agent-1",
			welcome_message: "Bonjour",
			suggested_prompts: ["Analyse ce contrat"],
			access: { can_chat: false, reason: "login_required" },
		});
	});

	it("renvoie api_key_required si la clé utilisateur manque", async () => {
		repo.findById.mockResolvedValue(makeAgent());
		prisma.user.findUnique.mockResolvedValue({ apiKeysEncrypted: [] });

		await expect(useCase.execute("agent-1", { id: "user-1", role: "USER" })).resolves.toMatchObject(
			{
				access: { can_chat: false, reason: "api_key_required", required_provider: "anthropic" },
			},
		);
	});

	it("autorise le chat si la clé utilisateur existe", async () => {
		repo.findById.mockResolvedValue(makeAgent());
		prisma.user.findUnique.mockResolvedValue({ apiKeysEncrypted: [{ provider: "anthropic" }] });

		await expect(useCase.execute("agent-1", { id: "user-1", role: "USER" })).resolves.toMatchObject(
			{
				access: { can_chat: true },
				capabilities: { files: true, images: false },
			},
		);
	});

	it("masque un agent non publié aux non propriétaires", async () => {
		repo.findById.mockResolvedValue(makeAgent({ 15: "DRAFT" }));

		await expect(useCase.execute("agent-1", { id: "user-1", role: "USER" })).rejects.toThrow(
			NotFoundException,
		);
	});

	it("laisse le propriétaire ouvrir son agent DRAFT", async () => {
		repo.findById.mockResolvedValue(makeAgent({ 15: "DRAFT", 25: null, 30: null }));

		await expect(
			useCase.execute("agent-1", { id: "creator-1", role: "USER" }),
		).resolves.toMatchObject({
			status: "draft",
			access: { can_chat: true },
		});
	});

	it("laisse un admin ouvrir un agent PENDING", async () => {
		repo.findById.mockResolvedValue(makeAgent({ 15: "PENDING", 25: null, 30: null }));

		await expect(
			useCase.execute("agent-1", { id: "admin-1", role: "ADMIN" }),
		).resolves.toMatchObject({
			status: "pending",
			access: { can_chat: true },
		});
	});

	it("masque un agent PENDING à un utilisateur non propriétaire", async () => {
		repo.findById.mockResolvedValue(makeAgent({ 15: "PENDING" }));

		await expect(useCase.execute("agent-1", { id: "user-1", role: "USER" })).rejects.toThrow(
			NotFoundException,
		);
	});

	it("exige un achat pour un agent payant sans accès", async () => {
		repo.findById.mockResolvedValue(
			makeAgent({ 12: "ONE_TIME", 13: 12, 25: "SELLER_API_KEY", 30: null }),
		);
		repo.hasPurchased.mockResolvedValue(false);
		repo.hasActiveSubscription.mockResolvedValue(false);

		await expect(
			useCase.execute("agent-1", { id: "user-1", role: "USER" }),
		).resolves.toMatchObject({
			access: { can_chat: false, reason: "purchase_required" },
		});
	});

	it("autorise le chat pour un agent payant déjà acheté", async () => {
		repo.findById.mockResolvedValue(
			makeAgent({ 12: "ONE_TIME", 13: 12, 25: "SELLER_API_KEY", 30: null }),
		);
		repo.hasPurchased.mockResolvedValue(true);
		repo.hasActiveSubscription.mockResolvedValue(false);

		await expect(
			useCase.execute("agent-1", { id: "user-1", role: "USER" }),
		).resolves.toMatchObject({
			access: { can_chat: true },
		});
	});

	it("normalise capabilities null en files/images false", async () => {
		repo.findById.mockResolvedValue(makeAgent({ 25: null, 30: null, 37: null }));

		await expect(
			useCase.execute("agent-1", { id: "creator-1", role: "USER" }),
		).resolves.toMatchObject({
			capabilities: { files: false, images: false },
		});
	});

	it.each([
		[["claude-sonnet-4-20250514"], "anthropic"],
		[["gpt-4o"], "openai"],
		[["mistral-large-latest"], "mistral"],
		[["gemini-1.5-pro"], "google"],
	])("déduit le provider %s → %s", async (models, expected) => {
		repo.findById.mockResolvedValue(makeAgent({ 7: models, 25: null, 30: null }));

		await expect(
			useCase.execute("agent-1", { id: "creator-1", role: "USER" }),
		).resolves.toMatchObject({ provider: expected });
	});
});
