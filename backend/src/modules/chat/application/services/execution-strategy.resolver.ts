import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
	ENCRYPTION_SERVICE,
	type EncryptionServicePort,
} from "../../../../common/ports/encryption.port.js";
import type { AgentEntity } from "../../../agents/domain/entities/agent.entity.js";
import type { AIProviderPort, StreamTextParams } from "../../domain/ports/ai-provider.port.js";
import { AnthropicProvider } from "../../infrastructure/providers/anthropic.provider.js";
import { EndpointProxyProvider } from "../../infrastructure/providers/endpoint-proxy.provider.js";
import { OpenAIProvider } from "../../infrastructure/providers/openai.provider.js";
import {
	MANAGE_API_KEYS_USE_CASE,
	type ManageApiKeysPort,
} from "./manage-api-keys.port.js";

export const EXECUTION_STRATEGY_RESOLVER = Symbol("EXECUTION_STRATEGY_RESOLVER");

export interface ResolvedStrategy {
	provider: AIProviderPort;
	extraParams: Partial<StreamTextParams> & { endpointFormat?: string };
}

@Injectable()
export class ExecutionStrategyResolver {
	constructor(
		private readonly anthropic: AnthropicProvider,
		private readonly openai: OpenAIProvider,
		private readonly endpointProxy: EndpointProxyProvider,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
		@Inject(MANAGE_API_KEYS_USE_CASE) private readonly apiKeys: ManageApiKeysPort,
	) {}

	async resolve(agent: AgentEntity, userId: string): Promise<ResolvedStrategy> {
		if (!agent.isCloudCapable()) {
			throw new BadRequestException(
				"Cet agent fonctionne uniquement en mode LOCAL. Téléchargez-le pour l'utiliser.",
			);
		}

		if (!agent.cloudStrategy) {
			throw new BadRequestException(
				"Cet agent n'est pas encore configuré pour l'exécution cloud.",
			);
		}

		switch (agent.cloudStrategy) {
			case "SELLER_ENDPOINT":
				return this.resolveSellerEndpoint(agent);
			case "SELLER_API_KEY":
				return this.resolveSellerApiKey(agent);
			case "USER_API_KEY":
				return this.resolveUserApiKey(agent, userId);
			default:
				throw new BadRequestException(`Stratégie d'exécution inconnue: ${agent.cloudStrategy}`);
		}
	}

	private resolveSellerEndpoint(agent: AgentEntity): ResolvedStrategy {
		if (!agent.endpointUrl || !agent.endpointFormat) {
			throw new BadRequestException("Agent endpoint configuration is incomplete");
		}
		return {
			provider: this.endpointProxy,
			extraParams: {
				baseUrl: agent.endpointUrl,
				endpointFormat: agent.endpointFormat,
			},
		};
	}

	private resolveSellerApiKey(agent: AgentEntity): ResolvedStrategy {
		if (!agent.sellerApiKeyEncrypted || !agent.sellerApiProvider) {
			throw new BadRequestException("Agent seller API key configuration is incomplete");
		}
		const apiKey = this.encryption.decrypt(agent.sellerApiKeyEncrypted);
		const provider = this.getProviderForName(agent.sellerApiProvider);
		return { provider, extraParams: { apiKey } };
	}

	private async resolveUserApiKey(
		agent: AgentEntity,
		userId: string,
	): Promise<ResolvedStrategy> {
		if (!agent.requiredUserProvider) {
			throw new BadRequestException("Agent required user provider is not configured");
		}
		const apiKey = await this.apiKeys.getDecryptedKeyForProvider(
			userId,
			agent.requiredUserProvider,
		);
		if (!apiKey) {
			throw new BadRequestException(
				`Vous devez configurer une clé API ${agent.requiredUserProvider} dans vos paramètres pour utiliser cet agent.`,
			);
		}
		const provider = this.getProviderForName(agent.requiredUserProvider);
		return { provider, extraParams: { apiKey } };
	}

	private getProviderForName(providerName: string): AIProviderPort {
		const name = providerName.toLowerCase();
		// Anthropic has its own format
		if (name.includes("anthropic") || name.includes("claude")) {
			return this.anthropic;
		}
		// All others use OpenAI-compatible format:
		// openai, google, mistral, cohere, deepseek, groq, xai,
		// perplexity, meta, together, fireworks, huggingface
		return this.openai;
	}
}
