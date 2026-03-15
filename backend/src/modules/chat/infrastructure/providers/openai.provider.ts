import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AIProviderPort, StreamTextParams } from "../../domain/ports/ai-provider.port.js";

@Injectable()
export class OpenAIProvider implements AIProviderPort {
	private readonly apiKey: string;

	constructor(private readonly config: ConfigService) {
		this.apiKey = this.config.getOrThrow<string>("OPENAI_API_KEY");
	}

	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		const messages: Array<{ role: string; content: string }> = [];

		if (params.systemPrompt) {
			messages.push({ role: "system", content: params.systemPrompt });
		}
		messages.push(...params.messages);

		const res = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: params.model,
				messages,
				max_tokens: params.maxTokens ?? 4096,
				stream: true,
			}),
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`OpenAI API error ${res.status}: ${err}`);
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
						const content = parsed.choices?.[0]?.delta?.content;
						if (content) {
							yield content;
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
