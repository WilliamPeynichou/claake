import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_TIMEOUT_MS = 15_000;
const MAX_EMBEDDING_INPUTS = 100;

@Injectable()
export class EmbeddingService {
	private readonly logger = new Logger(EmbeddingService.name);

	constructor(private readonly config: ConfigService) {}

	isConfigured(): boolean {
		return Boolean(this.config.get<string>("OPENAI_EMBEDDING_API_KEY"));
	}

	/** Returns null instead of breaking knowledge/chat when embeddings are unavailable. */
	async embed(inputs: string[]): Promise<number[][] | null> {
		if (inputs.length === 0) return [];
		const apiKey = this.config.get<string>("OPENAI_EMBEDDING_API_KEY");
		if (!apiKey) return null;
		if (inputs.length > MAX_EMBEDDING_INPUTS) {
			throw new Error(`Embedding batch exceeds ${MAX_EMBEDDING_INPUTS} inputs`);
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);
		try {
			const response = await fetch("https://api.openai.com/v1/embeddings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: EMBEDDING_MODEL,
					input: inputs,
					dimensions: EMBEDDING_DIMENSIONS,
				}),
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(`OpenAI embeddings returned ${response.status}`);
			const payload = (await response.json()) as {
				data?: Array<{ index: number; embedding: number[] }>;
			};
			const ordered = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);
			if (
				ordered.length !== inputs.length ||
				ordered.some((item) => item.embedding.length !== EMBEDDING_DIMENSIONS)
			) {
				throw new Error("Invalid embedding provider response");
			}
			return ordered.map((item) => item.embedding);
		} catch (error) {
			this.logger.warn(
				`Embedding provider unavailable; keyword fallback enabled: ${error instanceof Error ? error.message : "unknown"}`,
			);
			return null;
		} finally {
			clearTimeout(timeout);
		}
	}
}
