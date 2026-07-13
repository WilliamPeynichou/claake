import { Injectable } from "@nestjs/common";
import type {
	AIProviderPort,
	FileAttachment,
	ProviderStreamEvent,
	StreamTextParams,
} from "../../domain/ports/ai-provider.port.js";
import { textStreamToEvents } from "../../domain/ports/ai-provider.port.js";

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;
const TIMEOUT_MS = 60_000;
const MAX_TOOL_TURNS = 5;

type OpenAIContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

type OpenAIToolCall = {
	id: string;
	type: "function";
	function: { name: string; arguments: string };
};

type OpenAIMessage = {
	role: string;
	content: string | OpenAIContentPart[] | null;
	tool_calls?: OpenAIToolCall[];
	tool_call_id?: string;
};

/** One provider turn: streamed text deltas, collected tool calls, finish reason. */
type TurnEvent =
	| { kind: "text"; delta: string }
	| { kind: "tool_call"; id: string; name: string; argumentsJson: string }
	| { kind: "stop"; finishReason: string | null };

/** Minimal shape of OpenAI SSE stream events we consume. */
type OpenAiStreamEvent = {
	choices?: Array<{
		delta?: {
			content?: string;
			tool_calls?: Array<{
				index?: number;
				id?: unknown;
				function?: { name?: unknown; arguments?: unknown };
			}>;
		};
		finish_reason?: unknown;
	}>;
};

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
	/**
	 * Native OpenAI function calling (M8.1). When the agent has tools and the backend
	 * provides `executeTool`, runs the multi-turn loop: model emits `tool_calls`,
	 * backend executes, `role: "tool"` results are fed back until the model answers.
	 */
	async *streamEvents(params: StreamTextParams): AsyncIterable<ProviderStreamEvent> {
		if (!params.tools?.length || !params.executeTool) {
			yield* textStreamToEvents(this.streamText(params));
			return;
		}

		const messages = this.buildInitialMessages(params);

		for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
			const isLastTurn = turn === MAX_TOOL_TURNS;
			const toolCalls: Array<{ id: string; name: string; argumentsJson: string }> = [];
			let finishReason: string | null = null;

			for await (const event of this.streamTurn(params, messages, !isLastTurn)) {
				if (event.kind === "text") {
					yield { type: "text", delta: event.delta };
				} else if (event.kind === "tool_call") {
					toolCalls.push(event);
				} else {
					finishReason = event.finishReason;
				}
			}

			if (finishReason !== "tool_calls" || toolCalls.length === 0) {
				yield { type: "done" };
				return;
			}

			messages.push({
				role: "assistant",
				content: null,
				tool_calls: toolCalls.map((call) => ({
					id: call.id,
					type: "function",
					function: { name: call.name, arguments: call.argumentsJson },
				})),
			});
			for (const call of toolCalls) {
				let input: unknown = {};
				try {
					input = call.argumentsJson ? JSON.parse(call.argumentsJson) : {};
				} catch {
					input = {};
				}
				yield { type: "tool_call", id: call.id, name: call.name, input };
				const output = await params.executeTool({ id: call.id, name: call.name, input });
				yield { type: "tool_result", id: call.id, name: call.name, output };
				messages.push({
					role: "tool",
					tool_call_id: call.id,
					content: JSON.stringify(output ?? null),
				});
			}
		}

		yield { type: "done" };
	}

	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		const messages = this.buildInitialMessages(params);
		for await (const event of this.streamTurn(params, messages, false)) {
			if (event.kind === "text") yield event.delta;
		}
	}

	private buildInitialMessages(params: StreamTextParams): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

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
		return messages;
	}

	private async *streamTurn(
		params: StreamTextParams,
		messages: OpenAIMessage[],
		includeTools: boolean,
	): AsyncIterable<TurnEvent> {
		if (!params.apiKey) {
			throw new Error("No API key provided for OpenAI provider");
		}

		const baseUrl = params.baseUrl ?? "https://api.openai.com";
		const body: Record<string, unknown> = {
			model: params.model,
			messages,
			max_tokens: params.maxTokens ?? 4096,
			stream: true,
		};
		if (includeTools && params.tools?.length) {
			body.tools = params.tools.map((tool) => ({
				type: "function",
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema,
				},
			}));
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
		let res: Response;
		try {
			res = await fetch(`${baseUrl}/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${params.apiKey}`,
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});
		} catch {
			clearTimeout(timeout);
			throw new Error("OpenAI provider unavailable");
		}

		if (!res.ok || !res.body) {
			clearTimeout(timeout);
			throw new Error("OpenAI provider unavailable");
		}

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let totalSize = 0;
		let finishReason: string | null = null;
		// Tool calls stream as fragments keyed by index (id/name first, then argument chunks)
		const pendingToolCalls = new Map<number, { id: string; name: string; argumentsJson: string }>();

		const flushToolCalls = function* (): Iterable<TurnEvent> {
			for (const call of [...pendingToolCalls.keys()].sort((a, b) => a - b)) {
				const pending = pendingToolCalls.get(call);
				if (pending?.id && pending.name) {
					yield {
						kind: "tool_call",
						id: pending.id,
						name: pending.name,
						argumentsJson: pending.argumentsJson,
					};
				}
			}
			pendingToolCalls.clear();
		};

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.byteLength;
				if (totalSize > MAX_RESPONSE_SIZE) {
					throw new Error("OpenAI provider response exceeded maximum size");
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6);
					if (data === "[DONE]") {
						yield* flushToolCalls();
						yield { kind: "stop", finishReason };
						return;
					}

					let parsed: OpenAiStreamEvent;
					try {
						parsed = JSON.parse(data);
					} catch {
						continue; // Skip unparseable lines
					}

					const choice = parsed.choices?.[0];
					if (!choice) continue;
					if (choice.delta?.content) {
						yield { kind: "text", delta: choice.delta.content };
					}
					for (const toolDelta of choice.delta?.tool_calls ?? []) {
						const index = Number(toolDelta.index ?? 0);
						const pending = pendingToolCalls.get(index) ?? {
							id: "",
							name: "",
							argumentsJson: "",
						};
						if (toolDelta.id) pending.id = String(toolDelta.id);
						if (toolDelta.function?.name) pending.name = String(toolDelta.function.name);
						if (toolDelta.function?.arguments) {
							pending.argumentsJson += String(toolDelta.function.arguments);
						}
						pendingToolCalls.set(index, pending);
					}
					if (choice.finish_reason) {
						finishReason = String(choice.finish_reason);
					}
				}
			}
			yield* flushToolCalls();
			yield { kind: "stop", finishReason };
		} finally {
			clearTimeout(timeout);
			reader.releaseLock();
		}
	}
}
