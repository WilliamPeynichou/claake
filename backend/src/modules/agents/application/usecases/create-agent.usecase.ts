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
			price: dto.price,
			priceType: (dto.price_type ?? "free").toUpperCase(),
			model: dto.model,
			mode: (dto.mode ?? "cloud").toUpperCase(),
			version: dto.version ?? "1.0.0",
			creatorId,
		});
		return AgentTransformer.toDto(agent);
	}
}
