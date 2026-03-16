export const AI_PROVIDER_FACTORY = Symbol("AI_PROVIDER_FACTORY");

export interface StreamTextParams {
	model: string;
	systemPrompt: string | null;
	messages: Array<{ role: string; content: string }>;
	maxTokens?: number;
	apiKey?: string;
	baseUrl?: string;
}

export interface AIProviderPort {
	streamText(params: StreamTextParams): AsyncIterable<string>;
}

export interface AIProviderFactoryPort {
	getProvider(model: string): AIProviderPort;
}
