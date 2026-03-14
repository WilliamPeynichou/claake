import { Inject, Injectable } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentListParams,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";
import { AgentTransformer } from "../transformers/agent.transformer.js";

@Injectable()
export class ListAgentsUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(params: AgentListParams): Promise<{ agents: AgentResponseDto[]; total: number }> {
		const { agents, total } = await this.repo.findAll(params);
		return {
			agents: agents.map(AgentTransformer.toDto),
			total,
		};
	}
}
