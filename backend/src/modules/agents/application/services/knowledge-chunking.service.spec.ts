import { KnowledgeChunkingService } from "./knowledge-chunking.service";

describe("KnowledgeChunkingService", () => {
	const service = new KnowledgeChunkingService();

	it("returns no chunks for blank content", () => {
		expect(service.chunk("   \n")).toEqual([]);
	});

	it("keeps short content in one chunk", () => {
		expect(service.chunk("Contenu utile.")).toEqual(["Contenu utile."]);
	});

	it("splits long content with bounded overlap", () => {
		const text = Array.from({ length: 300 }, (_, index) => `Phrase ${index} document.`).join(" ");
		const chunks = service.chunk(text);
		expect(chunks.length).toBeGreaterThan(1);
		expect(chunks.every((chunk) => chunk.length <= 1200)).toBe(true);
		expect(chunks.join(" ")).toContain("Phrase 0 document");
		expect(chunks.at(-1)).toContain("Phrase 299 document");
	});

	it("caps abusive documents at 100 chunks", () => {
		const chunks = service.chunk("x ".repeat(100_000));
		expect(chunks).toHaveLength(100);
	});
});
