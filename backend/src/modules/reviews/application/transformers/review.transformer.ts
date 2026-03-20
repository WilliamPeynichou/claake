import type { ReviewEntity } from "../../domain/entities/review.entity.js";
import type { ReviewResponseDto } from "../dtos/review-response.dto.js";

export class ReviewTransformer {
	static toDto(entity: ReviewEntity): ReviewResponseDto {
		return {
			id: entity.id,
			user_id: entity.userId,
			agent_id: entity.agentId,
			rating: entity.rating,
			comment: entity.comment,
			verified_purchase: entity.verifiedPurchase,
			verified_interaction: entity.verifiedInteraction,
			helpful_count: entity.helpfulCount,
			user_name: entity.userName,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
		};
	}
}
