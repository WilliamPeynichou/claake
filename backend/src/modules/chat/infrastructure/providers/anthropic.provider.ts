import { Injectable } from "@nestjs/common";
import type { AIProviderPort, StreamTextParams } from "../../domain/ports/ai-provider.port.js";

@Injectable()
export class AnthropicProvider implements AIProviderPort {
	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		if (!params.apiKey) {
			throw new Error("No API key provided for Anthropic provider");
		}

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

		const res = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": params.apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`Anthropic API error ${res.status}: ${err}`);
		}

		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6);
					if (data === "[DONE]") return;

					try {
						const parsed = JSON.parse(data);
						if (
							parsed.type === "content_block_delta" &&
							parsed.delta?.type === "text_delta"
						) {
							yield parsed.delta.text;
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
}
