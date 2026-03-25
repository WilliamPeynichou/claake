import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
	ENCRYPTION_SERVICE,
	type EncryptionServicePort,
} from "../../../../common/ports/encryption.port.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";
import type { CreateAgentDto } from "../dtos/create-agent.dto.js";
import { AgentTransformer } from "../transformers/agent.transformer.js";

@Injectable()
export class CreateAgentUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
	) {}

	async execute(dto: CreateAgentDto, creatorId: string): Promise<AgentResponseDto> {
		const mode = (dto.mode ?? "CLOUD").toUpperCase();

		this.validateExecutionStrategy(dto, mode);

		let sellerApiKeyEncrypted: string | null = null;
		if (dto.seller_api_key) {
			sellerApiKeyEncrypted = this.encryption.encrypt(dto.seller_api_key);
		}

		const agent = await this.repo.create({
			name: dto.name,
			slug: dto.slug,
			description: dto.description,
			longDescription: dto.long_description ?? null,
			category: dto.category,
			tags: dto.tags,
			models: dto.models,
			mode,
			configUrl: dto.config_url ?? null,
			imageUrl: dto.image_url ?? null,
			systemPrompt: dto.system_prompt ?? null,
			pricingModel: (dto.pricing_model ?? "FREE").toUpperCase(),
			price: dto.price ?? 0,
			creditCost: dto.credit_cost ?? 1,
			permissions: dto.permissions ?? null,
			creatorId,
			cloudStrategy: dto.cloud_strategy ?? null,
			endpointUrl: dto.endpoint_url ?? null,
			endpointFormat: dto.endpoint_format ?? null,
			sellerApiKeyEncrypted,
			sellerApiProvider: dto.seller_api_provider ?? null,
			requiredUserProvider: dto.required_user_provider ?? null,
			dockerImage: dto.docker_image ?? null,
			downloadUrl: dto.download_url ?? null,
		});
		return AgentTransformer.toDto(agent);
	}

	private validateExecutionStrategy(dto: CreateAgentDto, mode: string): void {
		const isCloud = mode === "CLOUD" || mode === "HYBRID";
		const isLocal = mode === "LOCAL" || mode === "HYBRID";

		if (isCloud && !dto.cloud_strategy) {
			throw new BadRequestException("cloud_strategy is required for CLOUD or HYBRID mode agents");
		}

		if (dto.cloud_strategy === "SELLER_ENDPOINT") {
			if (!dto.endpoint_url) {
				throw new BadRequestException("endpoint_url is required for SELLER_ENDPOINT strategy");
			}
			if (!dto.endpoint_format) {
				throw new BadRequestException("endpoint_format is required for SELLER_ENDPOINT strategy");
			}
		}

		if (dto.cloud_strategy === "SELLER_API_KEY") {
			if (!dto.seller_api_key) {
				throw new BadRequestException("seller_api_key is required for SELLER_API_KEY strategy");
			}
			if (!dto.seller_api_provider) {
				throw new BadRequestException(
					"seller_api_provider is required for SELLER_API_KEY strategy",
				);
			}
		}

		if (dto.cloud_strategy === "USER_API_KEY") {
			if (!dto.required_user_provider) {
				throw new BadRequestException(
					"required_user_provider is required for USER_API_KEY strategy",
				);
			}
		}

		if (isLocal && !dto.docker_image && !dto.download_url) {
			throw new BadRequestException(
				"docker_image or download_url is required for LOCAL or HYBRID mode agents",
			);
		}
	}
}
