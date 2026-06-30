export const AI_PROVIDER_FACTORY = Symbol("AI_PROVIDER_FACTORY");

export interface FileAttachment {
	/** "image" for JPG/PNG/WebP, "document" for PDF */
	type: "image" | "document";
	url: string;
	mimeType: string;
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
}

export interface AIProviderPort {
	streamText(params: StreamTextParams): AsyncIterable<string>;
}

export interface AIProviderFactoryPort {
	getProvider(model: string): AIProviderPort;
}
