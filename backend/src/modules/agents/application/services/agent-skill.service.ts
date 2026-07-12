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

export interface AgentSkillResourceItem {
	id: string;
	path: string;
	content: string;
	created_at: Date;
}

export interface AgentSkillItem {
	id: string;
	agent_id: string;
	name: string;
	description: string | null;
	created_at: Date;
	updated_at: Date;
	resources: AgentSkillResourceItem[];
}

@Injectable()
export class AgentSkillService {
	constructor(private readonly prisma: PrismaService) {}

	async list(agentId: string, actor: Actor): Promise<AgentSkillItem[]> {
		await this.assertCanManage(agentId, actor);
		const skills = await this.prisma.agentSkill.findMany({
			where: { agentId },
			include: { resources: { orderBy: { path: "asc" } } },
			orderBy: { createdAt: "desc" },
		});
		return skills.map((skill) => this.toItem(skill));
	}

	async create(
		agentId: string,
		actor: Actor,
		input: { name: string; description?: string },
	): Promise<AgentSkillItem> {
		await this.assertCanManage(agentId, actor);
		const name = this.validateName(input.name);
		const skill = await this.prisma.agentSkill.create({
			data: { agentId, name, description: this.validateDescription(input.description) },
			include: { resources: { orderBy: { path: "asc" } } },
		});
		return this.toItem(skill);
	}

	async importMarkdown(
		agentId: string,
		actor: Actor,
		input: { name: string; description?: string },
		files: MarkdownFile[],
	): Promise<AgentSkillItem> {
		await this.assertCanManage(agentId, actor);
		const name = this.validateName(input.name);
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
				agentId,
				name,
				description: this.validateDescription(input.description),
				resources: { create: resources },
			},
			include: { resources: { orderBy: { path: "asc" } } },
		});
		return this.toItem(skill);
	}

	async remove(agentId: string, skillId: string, actor: Actor): Promise<void> {
		await this.assertCanManage(agentId, actor);
		const skill = await this.prisma.agentSkill.findUnique({ where: { id: skillId } });
		if (!skill || skill.agentId !== agentId) throw new NotFoundException("Skill introuvable.");
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

	private async assertCanManage(agentId: string, actor: Actor): Promise<void> {
		const agent = await this.prisma.agent.findUnique({
			where: { id: agentId },
			select: { creatorId: true },
		});
		if (!agent) throw new NotFoundException("Agent introuvable.");
		if (
			agent.creatorId !== actor.userId &&
			actor.role !== "ADMIN" &&
			actor.role !== "SUPER_ADMIN"
		) {
			throw new ForbiddenException("Accès refusé.");
		}
	}

	private toItem(skill: {
		id: string;
		agentId: string;
		name: string;
		description: string | null;
		createdAt: Date;
		updatedAt: Date;
		resources: Array<{ id: string; path: string; content: string; createdAt: Date }>;
	}): AgentSkillItem {
		return {
			id: skill.id,
			agent_id: skill.agentId,
			name: skill.name,
			description: skill.description,
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
