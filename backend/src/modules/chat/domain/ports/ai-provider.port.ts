export const AI_PROVIDER_FACTORY = Symbol("AI_PROVIDER_FACTORY");

export interface FileAttachment {
	/** "image" for JPG/PNG/WebP, "document" for PDF */
	type: "image" | "document";
	url: string;
	mimeType: string;
}

export interface ProviderToolDefinition {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
}

export type ProviderStreamEvent =
	| { type: "text"; delta: string }
	| { type: "tool_call"; id: string; name: string; input: unknown }
	| { type: "tool_result"; id: string; name: string; output: unknown }
	| { type: "done" };

export interface ToolCallRequest {
	id: string;
	name: string;
	input: unknown;
}

export interface StreamTextParams {
	model: string;
	systemPrompt: string | null;
	messages: Array<{ role: string; content: string }>;
	maxTokens?: number;
	apiKey?: string;
	baseUrl?: string;
	/** Files attached to the current user message (images / PDFs to analyse) */
	attachments?: FileAttachment[];
	tools?: ProviderToolDefinition[];
	/**
	 * Backend-owned tool executor. Providers supporting native tool calling call it
	 * between turns, then feed the output back to the model. Quotas/security live here.
	 */
	executeTool?: (call: ToolCallRequest) => Promise<unknown>;
}

export interface AIProviderPort {
	streamText(params: StreamTextParams): AsyncIterable<string>;
	streamEvents?(params: StreamTextParams): AsyncIterable<ProviderStreamEvent>;
}

export async function* textStreamToEvents(
	stream: AsyncIterable<string>,
): AsyncIterable<ProviderStreamEvent> {
	for await (const delta of stream) {
		yield { type: "text", delta };
	}
	yield { type: "done" };
}

export interface AIProviderFactoryPort {
	getProvider(model: string): AIProviderPort;
}
