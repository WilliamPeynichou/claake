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

type AnthropicContentBlock =
	| { type: "text"; text: string }
	| { type: "image"; source: { type: "url"; url: string } }
	| { type: "document"; source: { type: "url"; url: string } }
	| { type: "tool_use"; id: string; name: string; input: unknown }
	| { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = { role: "user" | "assistant"; content: string | AnthropicContentBlock[] };

/** One provider turn: streamed text deltas, collected tool_use blocks, stop reason. */
type TurnEvent =
	| { kind: "text"; delta: string }
	| { kind: "tool_use"; id: string; name: string; input: unknown }
	| { kind: "stop"; stopReason: string | null };

/** Minimal shape of Anthropic SSE stream events we consume. */
type AnthropicStreamEvent = {
	type?: string;
	delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: unknown };
	content_block?: { type?: string; id?: unknown; name?: unknown };
};

function buildAttachmentBlocks(attachments: FileAttachment[]): AnthropicContentBlock[] {
	return attachments.map((a) => {
		if (a.type === "document") {
			return { type: "document", source: { type: "url", url: a.url } };
		}
		return { type: "image", source: { type: "url", url: a.url } };
	});
}

@Injectable()
export class AnthropicProvider implements AIProviderPort {
	/**
	 * Native Anthropic tool calling (M8.1). When the agent has tools and the backend
	 * provides `executeTool`, runs the multi-turn loop: model emits `tool_use`,
	 * backend executes, `tool_result` is fed back until the model answers with text.
	 */
	async *streamEvents(params: StreamTextParams): AsyncIterable<ProviderStreamEvent> {
		if (!params.tools?.length || !params.executeTool) {
			yield* textStreamToEvents(this.streamText(params));
			return;
		}

		const messages = this.buildInitialMessages(params);

		for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
			const isLastTurn = turn === MAX_TOOL_TURNS;
			const assistantBlocks: AnthropicContentBlock[] = [];
			const toolUses: Array<{ id: string; name: string; input: unknown }> = [];
			let stopReason: string | null = null;
			let turnText = "";

			for await (const event of this.streamTurn(params, messages, !isLastTurn)) {
				if (event.kind === "text") {
					turnText += event.delta;
					yield { type: "text", delta: event.delta };
				} else if (event.kind === "tool_use") {
					toolUses.push(event);
				} else {
					stopReason = event.stopReason;
				}
			}

			if (stopReason !== "tool_use" || toolUses.length === 0) {
				yield { type: "done" };
				return;
			}

			if (turnText) assistantBlocks.push({ type: "text", text: turnText });
			const resultBlocks: AnthropicContentBlock[] = [];
			for (const toolUse of toolUses) {
				assistantBlocks.push({
					type: "tool_use",
					id: toolUse.id,
					name: toolUse.name,
					input: toolUse.input,
				});
				const { id, name, input } = toolUse;
				yield { type: "tool_call", id, name, input };
				const output = await params.executeTool({ id, name, input });
				yield { type: "tool_result", id, name, output };
				resultBlocks.push({
					type: "tool_result",
					tool_use_id: id,
					content: JSON.stringify(output ?? null),
				});
			}
			messages.push({ role: "assistant", content: assistantBlocks });
			messages.push({ role: "user", content: resultBlocks });
		}

		yield { type: "done" };
	}

	async *streamText(params: StreamTextParams): AsyncIterable<string> {
		const messages = this.buildInitialMessages(params);
		for await (const event of this.streamTurn(params, messages, false)) {
			if (event.kind === "text") yield event.delta;
		}
	}

	private buildInitialMessages(params: StreamTextParams): AnthropicMessage[] {
		return params.messages.map((m, idx) => {
			const isLastUserMessage = m.role === "user" && idx === params.messages.length - 1;

			// Attach files only to the last user message
			if (isLastUserMessage && params.attachments?.length) {
				const blocks: AnthropicContentBlock[] = [
					...buildAttachmentBlocks(params.attachments),
					{ type: "text", text: m.content },
				];
				return { role: "user" as const, content: blocks };
			}

			return { role: m.role as "user" | "assistant", content: m.content };
		});
	}

	private async *streamTurn(
		params: StreamTextParams,
		messages: AnthropicMessage[],
		includeTools: boolean,
	): AsyncIterable<TurnEvent> {
		if (!params.apiKey) {
			throw new Error("No API key provided for Anthropic provider");
		}

		const body: Record<string, unknown> = {
			model: params.model,
			max_tokens: params.maxTokens ?? 4096,
			messages,
			stream: true,
		};
		if (params.systemPrompt) {
			body.system = params.systemPrompt;
		}
		if (includeTools && params.tools?.length) {
			body.tools = params.tools.map((tool) => ({
				name: tool.name,
				description: tool.description,
				input_schema: tool.inputSchema,
			}));
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
		let res: Response;
		try {
			res = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": params.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});
		} catch {
			clearTimeout(timeout);
			throw new Error("Anthropic provider unavailable");
		}

		if (!res.ok || !res.body) {
			clearTimeout(timeout);
			throw new Error("Anthropic provider unavailable");
		}

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let totalSize = 0;
		let stopReason: string | null = null;
		// Currently streaming tool_use block (input arrives as partial JSON deltas)
		let pendingToolUse: { id: string; name: string; inputJson: string } | null = null;

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.byteLength;
				if (totalSize > MAX_RESPONSE_SIZE) {
					throw new Error("Anthropic provider response exceeded maximum size");
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const data = line.slice(6);
					if (data === "[DONE]") {
						yield { kind: "stop", stopReason };
						return;
					}

					let parsed: AnthropicStreamEvent;
					try {
						parsed = JSON.parse(data);
					} catch {
						continue; // Skip unparseable lines
					}

					if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
						yield { kind: "text", delta: parsed.delta.text ?? "" };
					} else if (
						parsed.type === "content_block_start" &&
						parsed.content_block?.type === "tool_use"
					) {
						pendingToolUse = {
							id: String(parsed.content_block.id ?? ""),
							name: String(parsed.content_block.name ?? ""),
							inputJson: "",
						};
					} else if (
						parsed.type === "content_block_delta" &&
						parsed.delta?.type === "input_json_delta" &&
						pendingToolUse
					) {
						pendingToolUse.inputJson += parsed.delta.partial_json ?? "";
					} else if (parsed.type === "content_block_stop" && pendingToolUse) {
						let input: unknown = {};
						try {
							input = pendingToolUse.inputJson ? JSON.parse(pendingToolUse.inputJson) : {};
						} catch {
							input = {};
						}
						yield { kind: "tool_use", id: pendingToolUse.id, name: pendingToolUse.name, input };
						pendingToolUse = null;
					} else if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
						stopReason = String(parsed.delta.stop_reason);
					}
				}
			}
			yield { kind: "stop", stopReason };
		} finally {
			clearTimeout(timeout);
			reader.releaseLock();
		}
	}
}
