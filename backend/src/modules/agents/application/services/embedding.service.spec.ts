import { ConfigService } from "@nestjs/config";
import { EmbeddingService } from "./embedding.service";

describe("EmbeddingService", () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it("returns null without configured key", async () => {
		const service = new EmbeddingService(new ConfigService({}));
		await expect(service.embed(["hello"])).resolves.toBeNull();
	});

	it("returns ordered 1536-dimensional embeddings", async () => {
		const vectorA = Array(1536).fill(0.1);
		const vectorB = Array(1536).fill(0.2);
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue({
				data: [
					{ index: 1, embedding: vectorB },
					{ index: 0, embedding: vectorA },
				],
			}),
		} as Response);
		const service = new EmbeddingService(new ConfigService({ OPENAI_EMBEDDING_API_KEY: "secret" }));

		await expect(service.embed(["a", "b"])).resolves.toEqual([vectorA, vectorB]);
		expect(global.fetch).toHaveBeenCalledWith(
			"https://api.openai.com/v1/embeddings",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("falls back to null on provider failure", async () => {
		global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
		const service = new EmbeddingService(new ConfigService({ OPENAI_EMBEDDING_API_KEY: "secret" }));
		await expect(service.embed(["hello"])).resolves.toBeNull();
	});
});
