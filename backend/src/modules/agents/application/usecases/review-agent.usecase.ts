import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";

@Injectable()
export class ReviewAgentUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(
		agentId: string,
		decision: "approve" | "reject",
		reason?: string,
	): Promise<{ status: string; reason?: string }> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		if (agent.status !== "PENDING") {
			throw new BadRequestException("Only pending agents can be reviewed");
		}

		if (decision === "approve") {
			await this.repo.updateStatus(agentId, "APPROVED", "PASSED");
			return { status: "approved" };
		}

		await this.repo.updateStatus(agentId, "REJECTED");
		return { status: "rejected", reason };
	}
}
