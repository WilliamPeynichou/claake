import type { AgentEntity } from "../../domain/entities/agent.entity.js";
import type { AgentResponseDto } from "../dtos/agent-response.dto.js";

export class AgentTransformer {
	static toDto(entity: AgentEntity): AgentResponseDto {
		return {
			id: entity.id,
			name: entity.name,
			slug: entity.slug,
			description: entity.description,
			long_description: entity.longDescription,
			category: entity.category,
			tags: entity.tags,
			price: entity.price,
			price_type: entity.priceType.toLowerCase(),
			image_url: entity.imageUrl,
			screenshots: entity.screenshots,
			creator_id: entity.creatorId,
			creator_name: entity.creatorName,
			model: entity.model,
			mode: entity.mode.toLowerCase(),
			version: entity.version,
			status: entity.status.toLowerCase(),
			downloads_count: entity.downloadsCount,
			average_rating: entity.averageRating,
			reviews_count: entity.reviewsCount,
			sandbox_uses: entity.sandboxUses,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
		};
	}
}
