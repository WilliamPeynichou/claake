import { Inject, Injectable } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";
import type { CreateAgentDto } from "../dtos/create-agent.dto.js";
import { AgentTransformer } from "../transformers/agent.transformer.js";

@Injectable()
export class CreateAgentUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(dto: CreateAgentDto, creatorId: string): Promise<AgentResponseDto> {
		const agent = await this.repo.create({
			name: dto.name,
			slug: dto.slug,
			description: dto.description,
			longDescription: dto.long_description ?? null,
			category: dto.category,
			tags: dto.tags,
			models: dto.models,
			mode: (dto.mode ?? "CLOUD").toUpperCase(),
			configUrl: dto.config_url ?? null,
			systemPrompt: dto.system_prompt ?? null,
			pricingModel: (dto.pricing_model ?? "FREE").toUpperCase(),
			price: dto.price ?? 0,
			creditCost: dto.credit_cost ?? 1,
			permissions: dto.permissions ?? null,
			creatorId,
		});
		return AgentTransformer.toDto(agent);
	}
}
