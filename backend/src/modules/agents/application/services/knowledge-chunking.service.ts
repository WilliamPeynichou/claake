import { Injectable } from "@nestjs/common";

export const KNOWLEDGE_CHUNK_SIZE = 1200;
export const KNOWLEDGE_CHUNK_OVERLAP = 200;

/** Deterministic paragraph-aware chunking. Long documents are preserved; embedding requests are batched separately. */
@Injectable()
export class KnowledgeChunkingService {
	chunk(text: string): string[] {
		const normalized = text
			.replace(/\r\n/g, "\n")
			.replace(/\n{3,}/g, "\n\n")
			.trim();
		if (!normalized) return [];

		const chunks: string[] = [];
		let start = 0;
		while (start < normalized.length) {
			let end = Math.min(start + KNOWLEDGE_CHUNK_SIZE, normalized.length);
			if (end < normalized.length) {
				const paragraphBreak = normalized.lastIndexOf("\n\n", end);
				const sentenceBreak = Math.max(
					normalized.lastIndexOf(". ", end),
					normalized.lastIndexOf("! ", end),
					normalized.lastIndexOf("? ", end),
				);
				const candidate = Math.max(paragraphBreak, sentenceBreak);
				if (candidate > start + KNOWLEDGE_CHUNK_SIZE / 2) end = candidate + 1;
			}
			const chunk = normalized.slice(start, end).trim();
			if (chunk) chunks.push(chunk);
			if (end >= normalized.length) break;
			start = Math.max(end - KNOWLEDGE_CHUNK_OVERLAP, start + 1);
		}
		return chunks;
	}
}
