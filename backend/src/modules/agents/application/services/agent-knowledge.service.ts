import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
	Optional,
} from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { KnowledgeIndexService } from "./knowledge-index.service.js";

const MAX_KNOWLEDGE_CHARS = 6000;
const MAX_KNOWLEDGE_DOCUMENTS = 5;

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
	private readonly logger = new Logger(AgentKnowledgeService.name);

	constructor(
		private readonly prisma: PrismaService,
		@Optional() private readonly index?: KnowledgeIndexService,
	) {}

	async ensureCanManage(agentId: string, actor: Actor): Promise<void> {
		await this.assertCanManage(agentId, actor);
	}

	async reindex(agentId: string, actor: Actor): Promise<{ indexed: number }> {
		await this.assertCanManage(agentId, actor);
		if (!this.index) return { indexed: 0 };
		const records = await this.prisma.agentKnowledge.findMany({ where: { agentId } });
		let indexed = 0;
		for (const record of records) {
			try {
				await this.index.indexDocument(record);
				indexed += 1;
			} catch (error) {
				this.logger.warn(
					`Knowledge reindex failed for document=${record.id}: ${error instanceof Error ? error.message : "unknown"}`,
				);
			}
		}
		return { indexed };
	}

	async add(
		agentId: string,
		actor: Actor,
		input: { title: string; content: string },
	): Promise<AgentKnowledgeItem> {
		await this.assertCanManage(agentId, actor);
		const record = await this.prisma.agentKnowledge.create({
			data: { agentId, title: input.title.trim(), content: input.content.trim() },
		});
		await this.safeIndex(record);
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

	async update(
		agentId: string,
		knowledgeId: string,
		actor: Actor,
		input: { title?: string; content?: string },
	): Promise<AgentKnowledgeItem> {
		await this.assertCanManage(agentId, actor);
		const current = await this.prisma.agentKnowledge.findUnique({ where: { id: knowledgeId } });
		if (!current || current.agentId !== agentId) {
			throw new NotFoundException("Document de connaissance introuvable.");
		}
		const updated = await this.prisma.agentKnowledge.update({
			where: { id: knowledgeId },
			data: {
				title: input.title?.trim() || current.title,
				content: input.content?.trim() || current.content,
			},
		});
		await this.safeIndex(updated);
		return this.toItem(updated);
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
	async buildKnowledgeContext(agentId: string, query?: string): Promise<string | null> {
		if (query?.trim() && this.index) {
			const retrieved = await this.index.retrieve(agentId, query);
			if (retrieved && retrieved.length > 0) {
				return this.capContext(retrieved.map((chunk) => `# ${chunk.title}\n${chunk.content}`));
			}
		}

		const records = await this.prisma.agentKnowledge.findMany({
			where: { agentId },
			orderBy: { createdAt: "asc" },
		});
		if (records.length === 0) return null;

		const ranked = this.rankByQuery(records, query).slice(0, MAX_KNOWLEDGE_DOCUMENTS);
		return this.capContext(ranked.map((record) => `# ${record.title}\n${record.content}`));
	}

	private capContext(blocks: string[]): string | null {
		const parts: string[] = [];
		let total = 0;
		for (const block of blocks) {
			const remaining = MAX_KNOWLEDGE_CHARS - total;
			if (remaining <= 0) break;
			if (block.length > remaining) {
				parts.push(block.slice(0, remaining));
				break;
			}
			parts.push(block);
			total += block.length;
		}
		return parts.length > 0 ? parts.join("\n\n") : null;
	}

	private async safeIndex(record: {
		id: string;
		agentId: string;
		title: string;
		content: string;
	}): Promise<void> {
		if (!this.index) return;
		try {
			await this.index.indexDocument(record);
		} catch (error) {
			this.logger.warn(
				`Knowledge indexing failed for document=${record.id}; keyword fallback remains available: ${error instanceof Error ? error.message : "unknown"}`,
			);
		}
	}

	private rankByQuery<T extends { title: string; content: string }>(
		records: T[],
		query?: string,
	): T[] {
		const terms = this.tokenize(query ?? "");
		if (terms.length === 0) return records;
		return [...records].sort((a, b) => this.score(b, terms) - this.score(a, terms));
	}

	private score(record: { title: string; content: string }, terms: string[]): number {
		const title = this.tokenize(record.title);
		const content = this.tokenize(record.content);
		return terms.reduce((sum, term) => {
			const inTitle = title.filter((token) => token === term).length * 3;
			const inContent = content.filter((token) => token === term).length;
			return sum + inTitle + inContent;
		}, 0);
	}

	private tokenize(text: string): string[] {
		return text
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.split(/[^a-z0-9]+/i)
			.filter((token) => token.length >= 3);
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
