import { Injectable } from "@nestjs/common";
import type {
	AIProviderPort,
	FileAttachment,
	StreamTextParams,
} from "../../domain/ports/ai-provider.port.js";

type OpenAIContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

function buildMultimodalContent(text: string, attachments: FileAttachment[]): OpenAIContentPart[] {
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

@Injectable()
export class OpenAIProvider implements AIProviderPort {
	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		if (!params.apiKey) {
			throw new Error("No API key provided for OpenAI provider");
		}

		const messages: Array<{ role: string; content: string | OpenAIContentPart[] }> = [];

		if (params.systemPrompt) {
			messages.push({ role: "system", content: params.systemPrompt });
		}
		params.messages.forEach((message, index) => {
			const isLastUserMessage = message.role === "user" && index === params.messages.length - 1;
			if (isLastUserMessage && params.attachments?.length) {
				messages.push({
					role: message.role,
					content: buildMultimodalContent(message.content, params.attachments),
				});
				return;
			}

			messages.push(message);
		});

		const baseUrl = params.baseUrl ?? "https://api.openai.com";

		const res = await fetch(`${baseUrl}/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${params.apiKey}`,
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
