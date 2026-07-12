import type { PrismaService } from "../../../../prisma/prisma.service";
import { KnowledgeIndexService } from "./knowledge-index.service";

describe("KnowledgeIndexService", () => {
	function makeService(embeddingResult: number[][] | null = null, chunks = ["chunk a", "chunk b"]) {
		const tx = {
			agentKnowledgeChunk: { deleteMany: jest.fn(), createMany: jest.fn() },
			$executeRaw: jest.fn(),
		};
		const prisma = {
			$transaction: jest.fn((callback) => callback(tx)),
			$queryRaw: jest.fn(),
			agentKnowledgeChunk: { deleteMany: jest.fn() },
		} as unknown as PrismaService;
		const chunking = { chunk: jest.fn().mockReturnValue(chunks) };
		const embeddings = { embed: jest.fn().mockResolvedValue(embeddingResult) };
		return {
			service: new KnowledgeIndexService(prisma, chunking as never, embeddings as never),
			prisma,
			tx,
			embeddings,
		};
	}

	it("stores chunks without vectors when provider is unavailable", async () => {
		const { service, tx } = makeService(null);
		await service.indexDocument({ id: "k-1", agentId: "a-1", title: "Doc", content: "body" });
		expect(tx.agentKnowledgeChunk.deleteMany).toHaveBeenCalledWith({
			where: { knowledgeId: "k-1" },
		});
		expect(tx.agentKnowledgeChunk.createMany).toHaveBeenCalledWith({
			data: expect.arrayContaining([
				expect.objectContaining({
					agentId: "a-1",
					knowledgeId: "k-1",
					chunkIndex: 0,
					content: "chunk a",
				}),
			]),
		});
		expect(tx.$executeRaw).not.toHaveBeenCalled();
	});

	it("stores vectors in a single batched statement when embeddings are available", async () => {
		const vectors = [Array(1536).fill(0.1), Array(1536).fill(0.2)];
		const { service, tx } = makeService(vectors);
		await service.indexDocument({ id: "k-1", agentId: "a-1", title: "Doc", content: "body" });
		expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
	});

	it("batches vector writes for documents with more than 100 chunks", async () => {
		const chunks = Array.from({ length: 101 }, (_, index) => `chunk ${index}`);
		const vectors = chunks.map(() => Array(1536).fill(0.1));
		const { service, tx } = makeService(vectors, chunks);

		await service.indexDocument({ id: "k-1", agentId: "a-1", title: "Doc", content: "body" });
		expect(tx.agentKnowledgeChunk.createMany).toHaveBeenCalledWith({
			data: expect.arrayContaining([expect.objectContaining({ chunkIndex: 100 })]),
		});
		expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
	});

	it("returns null when embeddings are unavailable for the query", async () => {
		const { service, prisma } = makeService(null);
		await expect(service.retrieve("a-1", "question")).resolves.toBeNull();
		expect(prisma.$queryRaw).not.toHaveBeenCalled();
	});

	it("returns vector matches from pgvector query", async () => {
		const { service, prisma } = makeService([Array(1536).fill(0.1)]);
		(prisma.$queryRaw as jest.Mock).mockResolvedValue([
			{ title: "Doc", content: "match", score: 0.9 },
		]);
		await expect(service.retrieve("a-1", "question")).resolves.toEqual([
			{ title: "Doc", content: "match", score: 0.9 },
		]);
	});

	it("filters out chunks below the similarity threshold", async () => {
		const { service, prisma } = makeService([Array(1536).fill(0.1)]);
		(prisma.$queryRaw as jest.Mock).mockResolvedValue([
			{ title: "Doc", content: "match", score: 0.9 },
			{ title: "Doc", content: "noise", score: 0.1 },
		]);
		await expect(service.retrieve("a-1", "question")).resolves.toEqual([
			{ title: "Doc", content: "match", score: 0.9 },
		]);
	});

	it("falls back to null when vector SQL is unavailable", async () => {
		const { service, prisma } = makeService([Array(1536).fill(0.1)]);
		(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("vector unavailable"));
		await expect(service.retrieve("a-1", "question")).resolves.toBeNull();
	});
});
