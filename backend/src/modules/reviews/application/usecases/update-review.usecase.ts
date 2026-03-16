import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	REVIEW_REPOSITORY,
	type ReviewRepositoryPort,
} from "../../domain/ports/review.repository.port.js";
import type { ReviewResponseDto } from "../dtos/review-response.dto.js";
import { ReviewTransformer } from "../transformers/review.transformer.js";

@Injectable()
export class UpdateReviewUseCase {
	constructor(
		@Inject(REVIEW_REPOSITORY) private readonly reviewRepo: ReviewRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(
		reviewId: string,
		data: { rating?: number; comment?: string },
		userId: string,
	): Promise<ReviewResponseDto> {
		const review = await this.reviewRepo.findById(reviewId);
		if (!review) throw new NotFoundException("Review not found");
		if (!review.isOwnedBy(userId)) throw new ForbiddenException();

		const updated = await this.reviewRepo.update(reviewId, data);

		// Recalculate agent stats
		const stats = await this.reviewRepo.computeAgentStats(review.agentId);
		await this.agentRepo.updateRating(review.agentId, stats.avg, stats.count);

		return ReviewTransformer.toDto(updated);
	}
}
