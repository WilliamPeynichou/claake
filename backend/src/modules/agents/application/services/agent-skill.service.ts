import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";

const MAX_RESOURCE_BYTES = 1024 * 1024;
const MAX_RESOURCES_PER_IMPORT = 100;
const MARKDOWN_MIME_TYPES = new Set(["", "text/markdown", "text/plain"]);

type Actor = { userId: string; role?: string };
type MarkdownFile = Pick<Express.Multer.File, "buffer" | "mimetype" | "originalname" | "size">;

const MAX_SKILL_DESCRIPTION_CHARS = 2000;
const MAX_SKILLS_PER_AGENT = 30;
const MAX_SKILL_DEPENDENCIES = 10;

export interface AgentSkillResourceItem {
	id: string;
	path: string;
	content: string;
	created_at: Date;
}

export interface AgentSkillItem {
	id: string;
	creator_id: string;
	name: string;
	description: string | null;
	dependencies: string[];
	created_at: Date;
	updated_at: Date;
	resources: AgentSkillResourceItem[];
}

const includeResources = { resources: { orderBy: { path: "asc" as const } } };

/**
 * Creator-owned skill library (M12 Lot 2). Skills are shared across a creator's
 * agents through explicit links; declared dependencies are validated against the
 * target agent's enabled tools and approved MCP servers at attach time.
 */
@Injectable()
export class AgentSkillService {
	constructor(private readonly prisma: PrismaService) {}

	/** Creator library: every skill owned by the actor. */
	async listLibrary(actor: Actor): Promise<AgentSkillItem[]> {
		const skills = await this.prisma.agentSkill.findMany({
			where: { creatorId: actor.userId },
			include: includeResources,
			orderBy: { createdAt: "desc" },
		});
		return skills.map((skill) => this.toItem(skill));
	}

	async list(agentId: string, actor: Actor): Promise<AgentSkillItem[]> {
		await this.assertCanManageAgent(agentId, actor);
		const links = await this.prisma.agentSkillLink.findMany({
			where: { agentId },
			include: { skill: { include: includeResources } },
			orderBy: { createdAt: "desc" },
		});
		return links.map((link) => this.toItem(link.skill));
	}

	async create(
		agentId: string,
		actor: Actor,
		input: { name: string; description?: string; dependencies?: string[] },
	): Promise<AgentSkillItem> {
		const agent = await this.assertCanManageAgent(agentId, actor);
		const name = this.validateName(input.name);
		await this.assertSkillQuota(agentId);
		const dependencies = this.validateDependencies(input.dependencies);
		await this.assertDependenciesSatisfied(agentId, agent.tools, dependencies);
		const skill = await this.prisma.agentSkill.create({
			data: {
				creatorId: agent.creatorId,
				name,
				description: this.validateDescription(input.description),
				dependencies,
				links: { create: { agentId } },
			},
			include: includeResources,
		});
		return this.toItem(skill);
	}

	async importMarkdown(
		agentId: string,
		actor: Actor,
		input: { name: string; description?: string; dependencies?: string[] },
		files: MarkdownFile[],
	): Promise<AgentSkillItem> {
		const agent = await this.assertCanManageAgent(agentId, actor);
		const name = this.validateName(input.name);
		await this.assertSkillQuota(agentId);
		const dependencies = this.validateDependencies(input.dependencies);
		await this.assertDependenciesSatisfied(agentId, agent.tools, dependencies);
		if (!files?.length) throw new BadRequestException("Aucun fichier Markdown fourni.");
		if (files.length > MAX_RESOURCES_PER_IMPORT) {
			throw new BadRequestException(`Maximum ${MAX_RESOURCES_PER_IMPORT} fichiers par import.`);
		}

		const resources = files.map((file) => this.validateMarkdownFile(file));
		const paths = new Set(resources.map((resource) => resource.path));
		if (paths.size !== resources.length) {
			throw new BadRequestException("Les chemins des ressources Markdown doivent être uniques.");
		}

		const skill = await this.prisma.agentSkill.create({
			data: {
				creatorId: agent.creatorId,
				name,
				description: this.validateDescription(input.description),
				dependencies,
				resources: { create: resources },
				links: { create: { agentId } },
			},
			include: includeResources,
		});
		return this.toItem(skill);
	}

	/** Attach an existing library skill to another agent of the same creator. */
	async attach(agentId: string, skillId: string, actor: Actor): Promise<AgentSkillItem> {
		const agent = await this.assertCanManageAgent(agentId, actor);
		const skill = await this.prisma.agentSkill.findUnique({
			where: { id: skillId },
			include: includeResources,
		});
		if (!skill || skill.creatorId !== agent.creatorId) {
			throw new NotFoundException("Skill introuvable dans la bibliothèque du créateur.");
		}
		await this.assertSkillQuota(agentId);
		await this.assertDependenciesSatisfied(
			agentId,
			agent.tools,
			this.toDependencies(skill.dependencies),
		);
		await this.prisma.agentSkillLink.upsert({
			where: { skillId_agentId: { skillId, agentId } },
			create: { skillId, agentId },
			update: {},
		});
		return this.toItem(skill);
	}

	/** Detach from this agent; the skill itself stays in the creator library. */
	async detach(agentId: string, skillId: string, actor: Actor): Promise<void> {
		await this.assertCanManageAgent(agentId, actor);
		const deleted = await this.prisma.agentSkillLink.deleteMany({
			where: { agentId, skillId },
		});
		if (deleted.count === 0) throw new NotFoundException("Skill introuvable.");
	}

	/** Delete a skill from the creator library (all links cascade). */
	async removeFromLibrary(skillId: string, actor: Actor): Promise<void> {
		const skill = await this.prisma.agentSkill.findUnique({ where: { id: skillId } });
		const isAdmin = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
		if (!skill || (skill.creatorId !== actor.userId && !isAdmin)) {
			throw new NotFoundException("Skill introuvable.");
		}
		await this.prisma.agentSkill.delete({ where: { id: skillId } });
	}

	private validateName(name: string): string {
		const normalized = name?.trim();
		if (!normalized || normalized.length > 120) {
			throw new BadRequestException("Le nom du skill est requis (120 caractères maximum).");
		}
		return normalized;
	}

	private validateDescription(description?: string): string | null {
		const normalized = description?.trim() || null;
		if (normalized && normalized.length > MAX_SKILL_DESCRIPTION_CHARS) {
			throw new BadRequestException(
				`La description du skill est limitée à ${MAX_SKILL_DESCRIPTION_CHARS} caractères.`,
			);
		}
		return normalized;
	}

	private validateDependencies(dependencies?: string[]): string[] {
		if (!dependencies?.length) return [];
		if (dependencies.length > MAX_SKILL_DEPENDENCIES) {
			throw new BadRequestException(`Un skill est limité à ${MAX_SKILL_DEPENDENCIES} dépendances.`);
		}
		const normalized = [...new Set(dependencies.map((name) => name.trim()).filter(Boolean))];
		if (normalized.some((name) => name.length > 200)) {
			throw new BadRequestException("Nom de dépendance invalide.");
		}
		return normalized;
	}

	/**
	 * Every declared dependency must resolve to an enabled built-in tool or to a
	 * selected tool of an approved, active MCP server of the agent.
	 */
	private async assertDependenciesSatisfied(
		agentId: string,
		agentTools: unknown,
		dependencies: string[],
	): Promise<void> {
		if (dependencies.length === 0) return;
		const enabledBuiltIns = new Set(
			(Array.isArray(agentTools) ? agentTools : [])
				.filter(
					(tool): tool is { name: string; enabled?: boolean } =>
						typeof tool === "object" && tool !== null && "name" in tool,
				)
				.filter((tool) => tool.enabled !== false)
				.map((tool) => tool.name),
		);
		const mcpTools = await this.prisma.mcpTool.findMany({
			where: {
				isSelected: true,
				server: { agentId, reviewStatus: "APPROVED", isActive: true },
			},
			select: { name: true },
		});
		const available = new Set([...enabledBuiltIns, ...mcpTools.map((tool) => tool.name)]);
		const missing = dependencies.filter((name) => !available.has(name));
		if (missing.length > 0) {
			throw new BadRequestException(
				`Dépendances non satisfaites pour cet agent : ${missing.join(", ")}. ` +
					"Activez les tools requis ou approuvez le serveur MCP correspondant.",
			);
		}
	}

	private async assertSkillQuota(agentId: string): Promise<void> {
		const count = await this.prisma.agentSkillLink.count({ where: { agentId } });
		if (count >= MAX_SKILLS_PER_AGENT) {
			throw new BadRequestException(
				`Un agent est limité à ${MAX_SKILLS_PER_AGENT} skills. Supprimez-en un avant d'en ajouter.`,
			);
		}
	}

	private validateMarkdownFile(file: MarkdownFile): { path: string; content: string } {
		const path = file?.originalname?.replaceAll("\\", "/").trim();
		if (!path?.toLowerCase().endsWith(".md")) {
			throw new BadRequestException("Seuls les fichiers Markdown .md sont acceptés.");
		}
		if (
			path.startsWith("/") ||
			path.split("/").some((part) => !part || part === "." || part === "..")
		) {
			throw new BadRequestException("Le chemin de la ressource Markdown est invalide.");
		}
		if (!MARKDOWN_MIME_TYPES.has(file.mimetype?.toLowerCase() ?? "")) {
			throw new BadRequestException("Le type MIME doit être Markdown ou texte brut.");
		}
		if (
			!file.buffer?.length ||
			file.size > MAX_RESOURCE_BYTES ||
			file.buffer.length > MAX_RESOURCE_BYTES
		) {
			throw new BadRequestException("Chaque ressource Markdown doit peser entre 1 octet et 1 Mo.");
		}

		let content: string;
		try {
			content = new TextDecoder("utf-8", { fatal: true })
				.decode(file.buffer)
				.replace(/^\uFEFF/, "");
		} catch {
			throw new BadRequestException("Les ressources Markdown doivent être encodées en UTF-8.");
		}
		if (content.includes("\0")) {
			throw new BadRequestException(
				"Les ressources Markdown ne peuvent pas contenir de données binaires.",
			);
		}
		if (!content.trim())
			throw new BadRequestException("Une ressource Markdown ne peut pas être vide.");
		return { path, content };
	}

	private async assertCanManageAgent(
		agentId: string,
		actor: Actor,
	): Promise<{ creatorId: string; tools: unknown }> {
		const agent = await this.prisma.agent.findUnique({
			where: { id: agentId },
			select: { creatorId: true, tools: true },
		});
		if (!agent) throw new NotFoundException("Agent introuvable.");
		const isAdmin = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
		if (agent.creatorId !== actor.userId && !isAdmin) {
			throw new ForbiddenException("Accès refusé.");
		}
		return agent;
	}

	private toDependencies(value: unknown): string[] {
		return Array.isArray(value)
			? value.filter((item): item is string => typeof item === "string")
			: [];
	}

	private toItem(skill: {
		id: string;
		creatorId: string;
		name: string;
		description: string | null;
		dependencies: unknown;
		createdAt: Date;
		updatedAt: Date;
		resources: Array<{ id: string; path: string; content: string; createdAt: Date }>;
	}): AgentSkillItem {
		return {
			id: skill.id,
			creator_id: skill.creatorId,
			name: skill.name,
			description: skill.description,
			dependencies: this.toDependencies(skill.dependencies),
			created_at: skill.createdAt,
			updated_at: skill.updatedAt,
			resources: skill.resources.map((resource) => ({
				id: resource.id,
				path: resource.path,
				content: resource.content,
				created_at: resource.createdAt,
			})),
		};
	}
}
