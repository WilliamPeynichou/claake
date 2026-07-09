import { Injectable, Logger } from "@nestjs/common";
import { assertPublicHttpUrl } from "../../../../common/security/public-url.js";
import { redactSensitive } from "../../../../common/security/redact-sensitive.js";
import type {
	AIProviderPort,
	FileAttachment,
	ProviderStreamEvent,
	StreamTextParams,
} from "../../domain/ports/ai-provider.port.js";
import { textStreamToEvents } from "../../domain/ports/ai-provider.port.js";

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 60_000;
const GENERIC_VENDOR_ERROR = "External AI endpoint is currently unavailable";

// Formats that use the OpenAI-compatible chat/completions API
const OPENAI_COMPATIBLE_FORMATS = new Set([
	"openai",
	"mistral",
	"deepseek",
	"groq",
	"xai",
	"perplexity",
	"meta",
	"together",
	"fireworks",
	"huggingface",
	"claake",
]);

type OpenAIContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

type AnthropicContentBlock =
	| { type: "text"; text: string }
	| { type: "image"; source: { type: "url"; url: string } }
	| { type: "document"; source: { type: "url"; url: string } };

function buildOpenAIContent(text: string, attachments: FileAttachment[]): OpenAIContentPart[] {
	const parts: OpenAIContentPart[] = [];
	for (const attachment of attachments) {
		if (attachment.type === "image") {
			parts.push({ type: "image_url", image_url: { url: attachment.url } });
		} else {
			parts.push({
				type: "text",
				text: `Document joint (${attachment.mimeType}) : ${attachment.url}`,
			});
		}
	}
	parts.push({ type: "text", text });
	return parts;
}

function buildAnthropicContent(
	text: string,
	attachments: FileAttachment[],
): AnthropicContentBlock[] {
	const blocks = attachments.map((attachment) => {
		if (attachment.type === "document") {
			return { type: "document", source: { type: "url", url: attachment.url } } as const;
		}
		return { type: "image", source: { type: "url", url: attachment.url } } as const;
	});
	return [...blocks, { type: "text", text }];
}

@Injectable()
export class EndpointProxyProvider implements AIProviderPort {
	private readonly logger = new Logger(EndpointProxyProvider.name);

	streamEvents(params: StreamTextParams): AsyncIterable<ProviderStreamEvent> {
		return textStreamToEvents(this.streamText(params));
	}

	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		if (!params.baseUrl) {
			throw new Error("No endpoint URL provided for proxy provider");
		}

		const endpointFormat = ((params as any).endpointFormat as string)?.toLowerCase() ?? "openai";
		const parsedBaseUrl = await assertPublicHttpUrl(params.baseUrl!);
		const { url, init } = this.buildRequest(
			{ ...params, baseUrl: parsedBaseUrl.toString() },
			endpointFormat,
		);

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

		try {
			const res = await fetch(url, { ...init, signal: controller.signal, redirect: "error" });

			if (!res.ok) {
				await this.readErrorSnippet(res);
				throw new Error(GENERIC_VENDOR_ERROR);
			}

			// Google Gemini returns JSON, not SSE
			if (endpointFormat === "google") {
				yield* this.parseGoogleResponse(res);
				return;
			}

			// Cohere uses a different SSE event format
			if (endpointFormat === "cohere") {
				yield* this.parseCohereSSE(res);
				return;
			}

			// All other formats use standard SSE (OpenAI-compatible or Anthropic)
			yield* this.parseStandardSSE(res, endpointFormat);
		} catch (error) {
			this.logger.warn(`Vendor endpoint request failed: ${this.redactError(error)}`);
			throw new Error(GENERIC_VENDOR_ERROR);
		} finally {
			clearTimeout(timeout);
		}
	}

	private async readErrorSnippet(res: Response): Promise<void> {
		await res.body?.cancel().catch(() => undefined);
		this.logger.warn(
			`Vendor endpoint returned HTTP ${res.status} content_length=${res.headers.get("content-length") ?? "unknown"}`,
		);
	}

	private redactError(error: unknown): string {
		if (!(error instanceof Error)) return "unknown error";
		return redactSensitive(error.message);
	}

	private async *parseStandardSSE(res: Response, format: string): AsyncIterable<string> {
		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let totalSize = 0;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.byteLength;
				if (totalSize > MAX_RESPONSE_SIZE) {
					throw new Error("Vendor endpoint response exceeded maximum size");
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6);
					if (data === "[DONE]") return;

					try {
						const parsed = JSON.parse(data);
						const text = this.extractText(parsed, format);
						if (text) yield text;
					} catch {
						// Skip unparseable lines
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	private async *parseGoogleResponse(res: Response): AsyncIterable<string> {
		const body = await res.text();
		try {
			const data = JSON.parse(body);
			// Gemini generateContent response format
			const candidates = data.candidates ?? [];
			for (const candidate of candidates) {
				const parts = candidate.content?.parts ?? [];
				for (const part of parts) {
					if (part.text) yield part.text;
				}
			}
		} catch {
			throw new Error("Failed to parse Google Gemini response");
		}
	}

	private async *parseCohereSSE(res: Response): AsyncIterable<string> {
		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let totalSize = 0;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.byteLength;
				if (totalSize > MAX_RESPONSE_SIZE) {
					throw new Error("Vendor endpoint response exceeded maximum size");
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const parsed = JSON.parse(line);
						// Cohere chat stream: event_type "text-generation"
						if (parsed.event_type === "text-generation" && parsed.text) {
							yield parsed.text;
						}
						// Cohere v2 chat stream uses content_type delta
						if (parsed.type === "content-delta" && parsed.delta?.message?.content?.text) {
							yield parsed.delta.message.content.text;
						}
					} catch {
						// Skip unparseable lines
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	private buildRequest(
		params: StreamTextParams,
		format: string,
	): { url: string; init: RequestInit } {
		if (format === "anthropic") {
			return this.buildAnthropicRequest(params);
		}
		if (format === "google") {
			return this.buildGoogleRequest(params);
		}
		if (format === "cohere") {
			return this.buildCohereRequest(params);
		}
		// All OpenAI-compatible formats
		return this.buildOpenAIRequest(params);
	}

	private buildAnthropicRequest(params: StreamTextParams): { url: string; init: RequestInit } {
		const messages = params.messages.map((m, idx) => {
			const isLastUserMessage = m.role === "user" && idx === params.messages.length - 1;
			if (isLastUserMessage && params.attachments?.length) {
				return {
					role: "user" as const,
					content: buildAnthropicContent(m.content, params.attachments),
				};
			}
			return {
				role: m.role as "user" | "assistant",
				content: m.content,
			};
		});

		const body: Record<string, unknown> = {
			model: params.model,
			max_tokens: params.maxTokens ?? 4096,
			messages,
			stream: true,
		};
		if (params.systemPrompt) {
			body.system = params.systemPrompt;
		}

		return {
			url: params.baseUrl!,
			init: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
		};
	}

	private buildGoogleRequest(params: StreamTextParams): { url: string; init: RequestInit } {
		const contents = params.messages.map((m) => ({
			role: m.role === "assistant" ? "model" : "user",
			parts: [{ text: m.content }],
		}));

		const body: Record<string, unknown> = { contents };
		if (params.systemPrompt) {
			body.systemInstruction = { parts: [{ text: params.systemPrompt }] };
		}
		if (params.maxTokens) {
			body.generationConfig = { maxOutputTokens: params.maxTokens };
		}

		return {
			url: params.baseUrl!,
			init: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			},
		};
	}

	private buildCohereRequest(params: StreamTextParams): { url: string; init: RequestInit } {
		const messages: Array<{ role: string; content: string }> = [];
		if (params.systemPrompt) {
			messages.push({ role: "system", content: params.systemPrompt });
		}
		messages.push(
			...params.messages.map((m) => ({
				role: m.role === "assistant" ? "chatbot" : "user",
				content: m.content,
			})),
		);

		return {
			url: params.baseUrl!,
			init: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: params.model,
					messages,
					max_tokens: params.maxTokens ?? 4096,
					stream: true,
				}),
			},
		};
	}

	private buildOpenAIRequest(params: StreamTextParams): { url: string; init: RequestInit } {
		const messages: Array<{ role: string; content: string | OpenAIContentPart[] }> = [];
		if (params.systemPrompt) {
			messages.push({ role: "system", content: params.systemPrompt });
		}
		params.messages.forEach((message, index) => {
			const isLastUserMessage = message.role === "user" && index === params.messages.length - 1;
			if (isLastUserMessage && params.attachments?.length) {
				messages.push({
					role: message.role,
					content: buildOpenAIContent(message.content, params.attachments),
				});
				return;
			}
			messages.push(message);
		});

		return {
			url: params.baseUrl!,
			init: {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: params.model,
					messages,
					max_tokens: params.maxTokens ?? 4096,
					stream: true,
				}),
			},
		};
	}

	private extractText(parsed: any, format: string): string | null {
		if (format === "anthropic") {
			if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
				return parsed.delta.text;
			}
			return null;
		}
		// OpenAI-compatible (openai, mistral, deepseek, groq, xai, perplexity, etc.)
		return parsed.choices?.[0]?.delta?.content ?? null;
	}
}
