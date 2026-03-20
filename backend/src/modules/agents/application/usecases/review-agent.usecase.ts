import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityLogService } from "../../../activity/domain/activity-log.service.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";

@Injectable()
export class ReviewAgentUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		private readonly activityLog: ActivityLogService,
	) {}

	async execute(
		agentId: string,
		decision: "approve" | "reject",
		reason?: string,
		actor?: { id: string; email: string },
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
			if (actor) {
				await this.activityLog.log({
					actorId: actor.id,
					actorEmail: actor.email,
					action: "agent.approved",
					targetType: "agent",
					targetId: agentId,
				});
			}
			return { status: "approved" };
		}

		await this.repo.updateStatus(agentId, "REJECTED");
		if (actor) {
			await this.activityLog.log({
				actorId: actor.id,
				actorEmail: actor.email,
				action: "agent.rejected",
				targetType: "agent",
				targetId: agentId,
				metadata: reason ? { reason } : undefined,
			});
		}
		return { status: "rejected", reason };
	}
}
