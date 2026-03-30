import { Injectable } from "@nestjs/common";
import type { AIProviderPort, StreamTextParams } from "../../domain/ports/ai-provider.port.js";

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const TIMEOUT_MS = 60_000;

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

@Injectable()
export class EndpointProxyProvider implements AIProviderPort {
	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		if (!params.baseUrl) {
			throw new Error("No endpoint URL provided for proxy provider");
		}

		const endpointFormat = ((params as any).endpointFormat as string)?.toLowerCase() ?? "openai";
		const { url, init } = this.buildRequest(params, endpointFormat);

		this.validateUrl(params.baseUrl!);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

		try {
			const res = await fetch(url, { ...init, signal: controller.signal, redirect: "error" });

			if (!res.ok) {
				const err = await res.text();
				throw new Error(`Vendor endpoint error ${res.status}: ${err}`);
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
		} finally {
			clearTimeout(timeout);
		}
	}

	private validateUrl(url: string): void {
		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			throw new Error("Invalid endpoint URL");
		}

		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			throw new Error("Endpoint URL must use http or https protocol");
		}

		const hostname = parsed.hostname.toLowerCase();

		// Block loopback
		if (hostname === "localhost" || hostname === "::1") {
			throw new Error("Endpoint URL points to a blocked address");
		}

		// Block by numeric IP ranges
		const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
		if (ipv4Match) {
			const [, a, b] = ipv4Match.map(Number);
			const octets = ipv4Match.slice(1).map(Number);
			// 127.x.x.x — loopback
			if (octets[0] === 127) throw new Error("Endpoint URL points to a blocked address");
			// 10.x.x.x — private
			if (octets[0] === 10) throw new Error("Endpoint URL points to a blocked address");
			// 172.16-31.x.x — private
			if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) throw new Error("Endpoint URL points to a blocked address");
			// 192.168.x.x — private
			if (octets[0] === 192 && octets[1] === 168) throw new Error("Endpoint URL points to a blocked address");
			// 169.254.x.x — link-local / AWS metadata
			if (octets[0] === 169 && octets[1] === 254) throw new Error("Endpoint URL points to a blocked address");
			// 0.x.x.x — invalid
			if (octets[0] === 0) throw new Error("Endpoint URL points to a blocked address");
		}
	}

	private async *parseStandardSSE(
		res: Response,
		format: string,
	): AsyncIterable<string> {
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
		const messages = params.messages.map((m) => ({
			role: m.role as "user" | "assistant",
			content: m.content,
		}));

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
		const messages: Array<{ role: string; content: string }> = [];
		if (params.systemPrompt) {
			messages.push({ role: "system", content: params.systemPrompt });
		}
		messages.push(...params.messages);

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
