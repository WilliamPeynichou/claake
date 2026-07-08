import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../../../../prisma/prisma.service";
import { AgentKnowledgeService } from "./agent-knowledge.service";

function makePrisma(overrides: Record<string, unknown> = {}) {
	return {
		agent: { findUnique: jest.fn().mockResolvedValue({ creatorId: "creator-1" }) },
		agentKnowledge: {
			create: jest
				.fn()
				.mockImplementation(({ data }) =>
					Promise.resolve({ id: "k-1", createdAt: new Date(), ...data }),
				),
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			update: jest
				.fn()
				.mockImplementation(({ data }) =>
					Promise.resolve({ id: "k-1", agentId: "agent-1", createdAt: new Date(), ...data }),
				),
			delete: jest.fn().mockResolvedValue(undefined),
		},
		...overrides,
	} as unknown as PrismaService;
}

const CREATOR = { userId: "creator-1" };
const OTHER = { userId: "user-2" };
const ADMIN = { userId: "admin", role: "ADMIN" };

describe("AgentKnowledgeService", () => {
	it("le créateur peut ajouter un document", async () => {
		const prisma = makePrisma();
		const service = new AgentKnowledgeService(prisma);
		const item = await service.add("agent-1", CREATOR, { title: " T ", content: " C " });
		expect(item.title).toBe("T");
		expect(item.agent_id).toBe("agent-1");
	});

	it("refuse un non-créateur non-admin", async () => {
		const service = new AgentKnowledgeService(makePrisma());
		await expect(
			service.add("agent-1", OTHER, { title: "T", content: "C" }),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it("autorise un admin", async () => {
		const service = new AgentKnowledgeService(makePrisma());
		await expect(service.list("agent-1", ADMIN)).resolves.toEqual([]);
	});

	it("modifie un document du bon agent", async () => {
		const prisma = makePrisma({
			agentKnowledge: {
				findUnique: jest
					.fn()
					.mockResolvedValue({ id: "k-1", agentId: "agent-1", title: "Old", content: "Old" }),
				update: jest.fn().mockResolvedValue({
					id: "k-1",
					agentId: "agent-1",
					title: "New",
					content: "Body",
					createdAt: new Date(),
				}),
			},
		});
		const service = new AgentKnowledgeService(prisma);
		const item = await service.update("agent-1", "k-1", CREATOR, { title: "New", content: "Body" });
		expect(item.title).toBe("New");
	});

	it("refuse la suppression d'un document d'un autre agent", async () => {
		const prisma = makePrisma({
			agentKnowledge: {
				findUnique: jest.fn().mockResolvedValue({ id: "k-1", agentId: "agent-2" }),
				delete: jest.fn(),
			},
		});
		const service = new AgentKnowledgeService(prisma);
		await expect(service.remove("agent-1", "k-1", CREATOR)).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it("construit un contexte à partir des documents", async () => {
		const prisma = makePrisma({
			agentKnowledge: {
				findMany: jest
					.fn()
					.mockResolvedValue([{ title: "Doc", content: "Contenu utile", createdAt: new Date() }]),
			},
		});
		const service = new AgentKnowledgeService(prisma);
		const ctx = await service.buildKnowledgeContext("agent-1");
		expect(ctx).toContain("Doc");
		expect(ctx).toContain("Contenu utile");
	});

	it("retourne null sans document", async () => {
		const service = new AgentKnowledgeService(makePrisma());
		await expect(service.buildKnowledgeContext("agent-1")).resolves.toBeNull();
	});

	it("classe les documents selon la requête utilisateur", async () => {
		const prisma = makePrisma({
			agentKnowledge: {
				findMany: jest.fn().mockResolvedValue([
					{ title: "Facturation", content: "Paiement et facture", createdAt: new Date() },
					{
						title: "Retour colis",
						content: "Remboursement et retour produit",
						createdAt: new Date(),
					},
				]),
			},
		});
		const service = new AgentKnowledgeService(prisma);
		const ctx = await service.buildKnowledgeContext("agent-1", "comment faire un retour produit");
		expect(ctx?.indexOf("Retour colis")).toBeLessThan(ctx?.indexOf("Facturation") ?? 9999);
	});

	it("plafonne le contexte de connaissance", async () => {
		const big = "x".repeat(10000);
		const prisma = makePrisma({
			agentKnowledge: {
				findMany: jest
					.fn()
					.mockResolvedValue([{ title: "Big", content: big, createdAt: new Date() }]),
			},
		});
		const service = new AgentKnowledgeService(prisma);
		const ctx = await service.buildKnowledgeContext("agent-1");
		expect(ctx?.length).toBeLessThanOrEqual(6000);
	});
});
