import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
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
export class UpdateAgentUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		@Inject(ENCRYPTION_SERVICE) private readonly encryption: EncryptionServicePort,
	) {}

	async execute(
		agentId: string,
		dto: Partial<CreateAgentDto>,
		userId: string,
	): Promise<AgentResponseDto> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		if (!agent.isOwnedBy(userId)) {
			throw new ForbiddenException("You can only edit your own agents");
		}

		if (agent.status === "APPROVED" || agent.status === "PENDING") {
			throw new BadRequestException(
				"Cannot edit an agent that is published or pending review. Contact support to unpublish first.",
			);
		}

		let sellerApiKeyEncrypted: string | null | undefined;
		if (dto.seller_api_key !== undefined) {
			sellerApiKeyEncrypted = dto.seller_api_key
				? this.encryption.encrypt(dto.seller_api_key)
				: null;
		}

		const updateData: any = {};
		if (dto.name !== undefined) updateData.name = dto.name;
		if (dto.description !== undefined) updateData.description = dto.description;
		if (dto.long_description !== undefined) updateData.longDescription = dto.long_description;
		if (dto.category !== undefined) updateData.category = dto.category;
		if (dto.tags !== undefined) updateData.tags = dto.tags;
		if (dto.models !== undefined) updateData.models = dto.models;
		if (dto.mode !== undefined) updateData.mode = dto.mode.toUpperCase();
		if (dto.config_url !== undefined) updateData.configUrl = dto.config_url;
		if (dto.image_url !== undefined) updateData.imageUrl = dto.image_url;
		if (dto.system_prompt !== undefined) updateData.systemPrompt = dto.system_prompt;
		if (dto.cloud_strategy !== undefined) updateData.cloudStrategy = dto.cloud_strategy;
		if (dto.endpoint_url !== undefined) updateData.endpointUrl = dto.endpoint_url;
		if (dto.endpoint_format !== undefined) updateData.endpointFormat = dto.endpoint_format;
		if (sellerApiKeyEncrypted !== undefined)
			updateData.sellerApiKeyEncrypted = sellerApiKeyEncrypted;
		if (dto.seller_api_provider !== undefined)
			updateData.sellerApiProvider = dto.seller_api_provider;
		if (dto.required_user_provider !== undefined)
			updateData.requiredUserProvider = dto.required_user_provider;
		if (dto.docker_image !== undefined) updateData.dockerImage = dto.docker_image;
		if (dto.download_url !== undefined) updateData.downloadUrl = dto.download_url;

		const updated = await this.repo.update(agentId, updateData);
		return AgentTransformer.toDto(updated);
	}
}
