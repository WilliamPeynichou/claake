import type { PrismaService } from "../../../../prisma/prisma.service";
import { AgentSkillContextService } from "./agent-skill-context.service";

function makePrisma(skills: unknown[]) {
	return {
		agentSkill: { findMany: jest.fn().mockResolvedValue(skills) },
	} as unknown as PrismaService;
}

function skill(
	name: string,
	resources: Array<{ path: string; content: string }>,
	description: string | null = null,
) {
	return {
		name,
		description,
		resources,
		createdAt: new Date(),
	};
}

describe("AgentSkillContextService", () => {
	it("selects resources matching query keywords before unrelated skills", async () => {
		const prisma = makePrisma([
			skill("Cuisine", [{ path: "recipes.md", content: "Pâtes et sauces" }]),
			skill("Droit social", [{ path: "contracts.md", content: "Clause de contrat de travail" }]),
		]);
		const service = new AgentSkillContextService(prisma);

		const context = await service.buildSkillContext("agent-1", "Analyse ce contrat de travail");

		expect(context).toContain("Droit social");
		expect(context).toContain("contracts.md");
		expect(context?.indexOf("Droit social")).toBeLessThan(context?.indexOf("Cuisine") ?? Infinity);
	});

	it("returns null when no safe resource can be injected", async () => {
		const prisma = makePrisma([
			skill("Unsafe", [
				{ path: "../secret.md", content: "secret" },
				{ path: "empty.md", content: "  " },
				{ path: "binary.md", content: "bad\0data" },
			]),
		]);

		await expect(
			new AgentSkillContextService(prisma).buildSkillContext("agent-1", "secret"),
		).resolves.toBeNull();
	});

	it("caps selected resources and total prompt context", async () => {
		const resources = Array.from({ length: 10 }, (_, index) => ({
			path: `reference-${index}.md`,
			content: "x".repeat(3000),
		}));
		const prisma = makePrisma([skill("Large", resources)]);

		const context = await new AgentSkillContextService(prisma).buildSkillContext(
			"agent-1",
			"large",
		);

		expect(context).not.toBeNull();
		expect(context?.length).toBeLessThanOrEqual(6000);
		expect(context?.match(/Fichier:/g) ?? []).toHaveLength(3);
	});

	it("uses stable database order when the query has no keywords", async () => {
		const prisma = makePrisma([
			skill("First", [{ path: "first.md", content: "one" }]),
			skill("Second", [{ path: "second.md", content: "two" }]),
		]);

		const context = await new AgentSkillContextService(prisma).buildSkillContext(
			"agent-1",
			"le la",
		);

		expect(context?.indexOf("First")).toBeLessThan(context?.indexOf("Second") ?? Infinity);
	});
});
