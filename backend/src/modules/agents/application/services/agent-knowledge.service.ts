import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";

const MAX_KNOWLEDGE_CHARS = 6000;

type Actor = { userId: string; role?: string };

export interface AgentKnowledgeItem {
	id: string;
	agent_id: string;
	title: string;
	content: string;
	created_at: Date;
}

/**
 * Base de connaissances agent (M6/F5.3). Le backend reste source de vérité :
 * seul le créateur (ou un admin) gère les documents ; le contexte est injecté au chat.
 */
@Injectable()
export class AgentKnowledgeService {
	constructor(private readonly prisma: PrismaService) {}

	async add(
		agentId: string,
		actor: Actor,
		input: { title: string; content: string },
	): Promise<AgentKnowledgeItem> {
		await this.assertCanManage(agentId, actor);
		const record = await this.prisma.agentKnowledge.create({
			data: { agentId, title: input.title.trim(), content: input.content.trim() },
		});
		return this.toItem(record);
	}

	async list(agentId: string, actor: Actor): Promise<AgentKnowledgeItem[]> {
		await this.assertCanManage(agentId, actor);
		const records = await this.prisma.agentKnowledge.findMany({
			where: { agentId },
			orderBy: { createdAt: "desc" },
		});
		return records.map((r) => this.toItem(r));
	}

	async remove(agentId: string, knowledgeId: string, actor: Actor): Promise<void> {
		await this.assertCanManage(agentId, actor);
		const record = await this.prisma.agentKnowledge.findUnique({ where: { id: knowledgeId } });
		if (!record || record.agentId !== agentId) {
			throw new NotFoundException("Document de connaissance introuvable.");
		}
		await this.prisma.agentKnowledge.delete({ where: { id: knowledgeId } });
	}

	/**
	 * Contexte de connaissance à injecter dans le system prompt (plafonné en taille).
	 * "Recherche contextuelle simple" V1 = concaténation des documents de l'agent.
	 */
	async buildKnowledgeContext(agentId: string): Promise<string | null> {
		const records = await this.prisma.agentKnowledge.findMany({
			where: { agentId },
			orderBy: { createdAt: "asc" },
		});
		if (records.length === 0) return null;

		const parts: string[] = [];
		let total = 0;
		for (const record of records) {
			const block = `# ${record.title}\n${record.content}`;
			if (total + block.length > MAX_KNOWLEDGE_CHARS) {
				parts.push(block.slice(0, MAX_KNOWLEDGE_CHARS - total));
				break;
			}
			parts.push(block);
			total += block.length;
		}
		return parts.join("\n\n");
	}

	private async assertCanManage(agentId: string, actor: Actor): Promise<void> {
		const agent = await this.prisma.agent.findUnique({
			where: { id: agentId },
			select: { creatorId: true },
		});
		if (!agent) {
			throw new NotFoundException("Agent introuvable.");
		}
		const isAdmin = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
		if (agent.creatorId !== actor.userId && !isAdmin) {
			throw new ForbiddenException("Accès refusé.");
		}
	}

	private toItem(record: {
		id: string;
		agentId: string;
		title: string;
		content: string;
		createdAt: Date;
	}): AgentKnowledgeItem {
		return {
			id: record.id,
			agent_id: record.agentId,
			title: record.title,
			content: record.content,
			created_at: record.createdAt,
		};
	}
}
