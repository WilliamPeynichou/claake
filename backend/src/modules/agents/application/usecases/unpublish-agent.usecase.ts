import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { ActivityLogService } from "../../../activity/domain/activity-log.service.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";

@Injectable()
export class UnpublishAgentUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		private readonly activityLog: ActivityLogService,
	) {}

	async execute(
		agentId: string,
		actor: { id: string; email: string },
	): Promise<{ status: string }> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		if (!agent.isOwnedBy(actor.id)) {
			throw new ForbiddenException("Only the owner can unpublish this agent");
		}

		if (agent.status !== "APPROVED") {
			throw new BadRequestException("Only published agents can be unpublished");
		}

		await this.repo.updateStatus(agentId, "DRAFT");

		await this.activityLog.log({
			actorId: actor.id,
			actorEmail: actor.email,
			action: "agent.unpublished",
			targetType: "agent",
			targetId: agentId,
			metadata: { name: agent.name },
		});

		return { status: "draft" };
	}
}
