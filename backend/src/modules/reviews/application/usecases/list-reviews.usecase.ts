import { Inject, Injectable } from "@nestjs/common";
import {
	REVIEW_REPOSITORY,
	type ReviewRepositoryPort,
} from "../../domain/ports/review.repository.port.js";
import type { ReviewResponseDto } from "../dtos/review-response.dto.js";
import { ReviewTransformer } from "../transformers/review.transformer.js";

@Injectable()
export class ListReviewsUseCase {
	constructor(
		@Inject(REVIEW_REPOSITORY) private readonly repo: ReviewRepositoryPort,
	) {}

	async execute(
		agentId: string,
		page = 1,
		limit = 10,
	): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
		const { reviews, total } = await this.repo.findByAgentId(agentId, page, limit);
		return {
			reviews: reviews.map(ReviewTransformer.toDto),
			total,
		};
	}
}
