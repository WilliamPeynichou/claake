import { Injectable } from "@nestjs/common";
import type { AIProviderFactoryPort, AIProviderPort } from "../../domain/ports/ai-provider.port.js";
import { AnthropicProvider } from "./anthropic.provider.js";
import { OpenAIProvider } from "./openai.provider.js";

@Injectable()
export class AIProviderFactory implements AIProviderFactoryPort {
	constructor(
		private readonly anthropic: AnthropicProvider,
		private readonly openai: OpenAIProvider,
	) {}

	getProvider(model: string): AIProviderPort {
		if (model.includes("claude")) {
			return this.anthropic;
		}
		if (model.includes("gpt") || model.includes("o1")) {
			return this.openai;
		}
		// Default to Anthropic
		return this.anthropic;
	}
}
