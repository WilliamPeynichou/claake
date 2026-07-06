import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityLogService } from "../../../activity/domain/activity-log.service.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import type { ReviewAgentDecision } from "../dtos/review-agent.dto.js";

@Injectable()
export class ReviewAgentUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort,
		private readonly activityLog: ActivityLogService,
	) {}

	async execute(
		agentId: string,
		decision: ReviewAgentDecision,
		reason?: string,
		actor?: { id: string; email: string },
	): Promise<{ status: string; reason?: string }> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		const nextStatus = this.resolveNextStatus(agent.status, decision);
		const scanStatus = decision === "approve" ? "PASSED" : undefined;
		await this.repo.updateStatus(agentId, nextStatus, scanStatus);

		if (actor) {
			await this.activityLog.log({
				actorId: actor.id,
				actorEmail: actor.email,
				action: `agent.${this.actionName(decision)}`,
				targetType: "agent",
				targetId: agentId,
				metadata: reason ? { reason } : undefined,
			});
		}

		return {
			status: nextStatus.toLowerCase(),
			...(reason ? { reason } : {}),
		};
	}

	private resolveNextStatus(currentStatus: string, decision: ReviewAgentDecision): string {
		switch (decision) {
			case "approve":
				if (currentStatus !== "PENDING") {
					throw new BadRequestException("Only pending agents can be approved");
				}
				return "APPROVED";
			case "reject":
				if (currentStatus !== "PENDING") {
					throw new BadRequestException("Only pending agents can be rejected");
				}
				return "REJECTED";
			case "suspend":
				if (currentStatus !== "APPROVED") {
					throw new BadRequestException("Only approved agents can be suspended");
				}
				return "SUSPENDED";
			case "back_to_draft":
				if (!["PENDING", "REJECTED", "SUSPENDED"].includes(currentStatus)) {
					throw new BadRequestException(
						"Only pending, rejected or suspended agents can be moved back to draft",
					);
				}
				return "DRAFT";
		}
	}

	private actionName(decision: ReviewAgentDecision): string {
		switch (decision) {
			case "approve":
				return "approved";
			case "reject":
				return "rejected";
			case "suspend":
				return "suspended";
			case "back_to_draft":
				return "moved_to_draft";
		}
	}
}
