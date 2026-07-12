import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../../../../prisma/prisma.service";
import { AgentSkillService } from "./agent-skill.service";

function makePrisma(overrides: Record<string, unknown> = {}) {
	return {
		agent: { findUnique: jest.fn().mockResolvedValue({ creatorId: "creator-1", tools: [] }) },
		agentSkillLink: {
			count: jest.fn().mockResolvedValue(0),
			findMany: jest.fn().mockResolvedValue([]),
			deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
			upsert: jest.fn(),
		},
		mcpTool: { findMany: jest.fn().mockResolvedValue([]) },
		agentSkill: {
			count: jest.fn().mockResolvedValue(0),
			create: jest.fn().mockImplementation(({ data }) =>
				Promise.resolve({
					id: "skill-1",
					createdAt: new Date(),
					updatedAt: new Date(),
					...data,
					resources: data.resources?.create ?? [],
				}),
			),
			findMany: jest.fn().mockResolvedValue([]),
			findUnique: jest.fn().mockResolvedValue(null),
			delete: jest.fn().mockResolvedValue(undefined),
		},
		...overrides,
	} as unknown as PrismaService;
}

function file(name: string, content = "# Resource", mimetype = "text/markdown") {
	const buffer = Buffer.from(content);
	return { originalname: name, mimetype, buffer, size: buffer.length } as Express.Multer.File;
}

describe("AgentSkillService", () => {
	it("imports multiple Markdown files from a folder, preserving relative paths", async () => {
		const prisma = makePrisma();
		const service = new AgentSkillService(prisma);

		const skill = await service.importMarkdown(
			"agent-1",
			{ userId: "creator-1" },
			{ name: "Support" },
			[file("support/SKILL.md"), file("support/references/ref.md", "Reference")],
		);

		expect(skill.resources.map((resource) => resource.path)).toEqual([
			"support/SKILL.md",
			"support/references/ref.md",
		]);
		expect(
			(prisma.agentSkill.create as jest.Mock).mock.calls[0][0].data.resources.create,
		).toHaveLength(2);
	});

	it("rejects non-Markdown extensions regardless of MIME type", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [
				file("script.ts"),
			]),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("accepts files without MIME type as some browsers omit it", async () => {
		const service = new AgentSkillService(makePrisma());
		const noMime = file("README.md");
		// biome-ignore lint/suspicious/noExplicitAny: simulate browser omitting MIME
		(noMime as any).mimetype = undefined;
		const skill = await service.importMarkdown(
			"agent-1",
			{ userId: "creator-1" },
			{ name: "Test" },
			[noMime],
		);
		expect(skill.resources).toHaveLength(1);
	});

	it("rejects skill descriptions above the maximum length", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(
			service.create(
				"agent-1",
				{ userId: "creator-1" },
				{ name: "Test", description: "d".repeat(2001) },
			),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("rejects creation and import once the per-agent skill quota is reached", async () => {
		const prisma = makePrisma();
		(prisma.agentSkillLink.count as jest.Mock).mockResolvedValue(30);
		const service = new AgentSkillService(prisma);
		await expect(
			service.create("agent-1", { userId: "creator-1" }, { name: "Test" }),
		).rejects.toBeInstanceOf(BadRequestException);
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [
				file("README.md"),
			]),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("rejects non text/Markdown MIME types", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [
				file("SKILL.md", "# Test", "application/pdf"),
			]),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("rejects invalid UTF-8 content", async () => {
		const service = new AgentSkillService(makePrisma());
		const invalid = file("SKILL.md");
		invalid.buffer = Buffer.from([0xc3, 0x28]);
		invalid.size = invalid.buffer.length;
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [invalid]),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("rejects duplicate or unsafe resource paths", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [
				file("../SKILL.md"),
			]),
		).rejects.toBeInstanceOf(BadRequestException);
		await expect(
			service.importMarkdown("agent-1", { userId: "creator-1" }, { name: "Test" }, [
				file("SKILL.md"),
				file("SKILL.md"),
			]),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("enforces agent ownership", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(service.list("agent-1", { userId: "other" })).rejects.toBeInstanceOf(
			ForbiddenException,
		);
	});

	it("reports a missing skill when detaching", async () => {
		const service = new AgentSkillService(makePrisma());
		await expect(
			service.detach("agent-1", "missing", { userId: "creator-1" }),
		).rejects.toBeInstanceOf(NotFoundException);
	});
});
