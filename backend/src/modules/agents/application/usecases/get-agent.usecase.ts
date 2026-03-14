import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";
import { AgentTransformer } from "../transformers/agent.transformer.js";

@Injectable()
export class GetAgentUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(id: string): Promise<AgentResponseDto> {
		const agent = await this.repo.findById(id);
		if (!agent) {
			throw new NotFoundException(`Agent ${id} not found`);
		}
		return AgentTransformer.toDto(agent);
	}
}
