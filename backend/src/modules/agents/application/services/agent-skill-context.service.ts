import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";

const MAX_SKILLS = 3;
const MAX_RESOURCES = 6;
const MAX_CONTEXT_CHARS = 6000;
const MAX_RESOURCE_CHARS = 2000;

/**
 * Selects a small, relevant subset of creator-managed Skill resources for chat.
 * Resource content is deliberately bounded again at read time: imports are validated,
 * but database contents must not be allowed to make prompts unbounded.
 */
@Injectable()
export class AgentSkillContextService {
	constructor(private readonly prisma: PrismaService) {}

	async buildSkillContext(agentId: string, query?: string): Promise<string | null> {
		const skills = await this.prisma.agentSkill.findMany({
			where: { agentId },
			include: { resources: { orderBy: { path: "asc" } } },
			orderBy: { createdAt: "asc" },
		});
		if (skills.length === 0) return null;

		const terms = this.tokenize(query ?? "");
		const rankedSkills = skills
			.map((skill, index) => ({
				skill,
				index,
				score: this.score(`${skill.name}\n${skill.description ?? ""}`, terms),
			}))
			.sort((a, b) => b.score - a.score || a.index - b.index)
			.slice(0, MAX_SKILLS);

		const resources = rankedSkills
			.flatMap(({ skill, score, index }) =>
				skill.resources.map((resource, resourceIndex) => ({
					skillName: skill.name,
					path: resource.path,
					content: resource.content,
					score: score + this.score(`${resource.path}\n${resource.content}`, terms),
					index: index * 1000 + resourceIndex,
				})),
			)
			.filter((resource) => this.isSafeResource(resource.path, resource.content))
			.sort((a, b) => b.score - a.score || a.index - b.index)
			.slice(0, MAX_RESOURCES);

		const blocks: string[] = [];
		let length = 0;
		for (const resource of resources) {
			const content = resource.content.slice(0, MAX_RESOURCE_CHARS);
			const separator = blocks.length > 0 ? "\n\n---\n\n" : "";
			const block = `## Skill: ${resource.skillName}\nFichier: ${resource.path}\n\n${content}`;
			const remaining = MAX_CONTEXT_CHARS - length - separator.length;
			if (remaining <= 0) break;
			blocks.push(`${separator}${block.slice(0, remaining)}`);
			length += separator.length + Math.min(block.length, remaining);
		}

		return blocks.length > 0 ? blocks.join("") : null;
	}

	private isSafeResource(path: string, content: string): boolean {
		return (
			typeof path === "string" &&
			typeof content === "string" &&
			path.length > 0 &&
			path.length <= 500 &&
			!path.startsWith("/") &&
			!path.split("/").some((part) => !part || part === "." || part === "..") &&
			!content.includes("\0") &&
			content.trim().length > 0
		);
	}

	private score(text: string, terms: string[]): number {
		if (terms.length === 0) return 0;
		const tokens = this.tokenize(text);
		return terms.reduce(
			(total, term) => total + tokens.filter((token) => token === term).length,
			0,
		);
	}

	private tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.split(/[^a-z0-9]+/i)
			.filter((token) => token.length >= 3);
	}
}
