import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { EmbeddingService } from "./embedding.service.js";
import { KnowledgeChunkingService } from "./knowledge-chunking.service.js";

export interface RetrievedKnowledgeChunk {
	content: string;
	title: string;
	score: number;
}

@Injectable()
export class KnowledgeIndexService {
	private readonly logger = new Logger(KnowledgeIndexService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly chunking: KnowledgeChunkingService,
		private readonly embeddings: EmbeddingService,
	) {}

	async indexDocument(document: {
		id: string;
		agentId: string;
		title: string;
		content: string;
	}): Promise<void> {
		const chunks = this.chunking.chunk(document.content);
		const vectors = await this.embeddings.embed(chunks);
		const records = chunks.map((content, chunkIndex) => ({
			id: randomUUID(),
			agentId: document.agentId,
			knowledgeId: document.id,
			chunkIndex,
			content,
		}));

		await this.prisma.$transaction(async (tx) => {
			await tx.agentKnowledgeChunk.deleteMany({ where: { knowledgeId: document.id } });
			if (records.length === 0) return;
			await tx.agentKnowledgeChunk.createMany({ data: records });
			if (!vectors) return;
			for (let index = 0; index < records.length; index++) {
				const vector = vectors[index];
				if (!vector) continue;
				await tx.$executeRaw(
					Prisma.sql`UPDATE "agent_knowledge_chunks"
					SET "embedding" = ${this.vectorLiteral(vector)}::vector
					WHERE "id" = ${records[index]?.id}`,
				);
			}
		});
	}

	async removeDocument(knowledgeId: string): Promise<void> {
		await this.prisma.agentKnowledgeChunk.deleteMany({ where: { knowledgeId } });
	}

	async retrieve(
		agentId: string,
		query: string,
		limit = 5,
	): Promise<RetrievedKnowledgeChunk[] | null> {
		const vectors = await this.embeddings.embed([query]);
		const queryVector = vectors?.[0];
		if (!queryVector) return null;

		try {
			const safeLimit = Math.min(Math.max(limit, 1), 10);
			return await this.prisma.$queryRaw<RetrievedKnowledgeChunk[]>(
				Prisma.sql`SELECT c."content", k."title",
					(1 - (c."embedding" <=> ${this.vectorLiteral(queryVector)}::vector))::float AS "score"
				FROM "agent_knowledge_chunks" c
				JOIN "agent_knowledge" k ON k."id" = c."knowledge_id"
				WHERE c."agent_id" = ${agentId} AND c."embedding" IS NOT NULL
				ORDER BY c."embedding" <=> ${this.vectorLiteral(queryVector)}::vector
				LIMIT ${safeLimit}`,
			);
		} catch (error) {
			this.logger.warn(
				`Vector retrieval unavailable for agent=${agentId}; keyword fallback enabled: ${error instanceof Error ? error.message : "unknown"}`,
			);
			return null;
		}
	}

	private vectorLiteral(vector: number[]): string {
		return `[${vector.map((value) => (Number.isFinite(value) ? value : 0)).join(",")}]`;
	}
}
