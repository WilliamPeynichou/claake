import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	REVIEW_REPOSITORY,
	type ReviewRepositoryPort,
} from "../../domain/ports/review.repository.port.js";

@Injectable()
export class DeleteReviewUseCase {
	constructor(
		@Inject(REVIEW_REPOSITORY) private readonly reviewRepo: ReviewRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(reviewId: string, userId: string, userRole: string): Promise<{ deleted: boolean }> {
		const review = await this.reviewRepo.findById(reviewId);
		if (!review) throw new NotFoundException("Review not found");

		const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
		if (!review.isOwnedBy(userId) && !isAdmin) throw new ForbiddenException();

		await this.reviewRepo.delete(reviewId);

		// Recalculate agent stats
		const stats = await this.reviewRepo.computeAgentStats(review.agentId);
		await this.agentRepo.updateRating(review.agentId, stats.avg, stats.count);

		return { deleted: true };
	}
}
