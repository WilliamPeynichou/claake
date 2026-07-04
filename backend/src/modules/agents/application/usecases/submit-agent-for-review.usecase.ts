import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { ValidationResult } from "./validate-agent.usecase.js";
import { ValidateAgentUseCase } from "./validate-agent.usecase.js";

@Injectable()
export class SubmitAgentForReviewUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		private readonly validateAgent: ValidateAgentUseCase,
	) {}

	async execute(agentId: string, userId: string): Promise<ValidationResult> {
		const agent = await this.repo.findById(agentId);
		if (!agent) throw new NotFoundException("Agent not found");
		if (!agent.isOwnedBy(userId))
			throw new ForbiddenException("You can only submit your own agents");
		if (agent.status !== "DRAFT" && agent.status !== "REJECTED") {
			throw new BadRequestException("Only draft or rejected agents can be submitted for review");
		}
		return this.validateAgent.execute(agentId);
	}
}
