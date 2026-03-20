import type { CollectionEntity } from "../../domain/entities/collection.entity.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";

export class CollectionTransformer {
	static toDto(entity: CollectionEntity): CollectionResponseDto {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			is_public: entity.isPublic,
			agent_ids: entity.agentIds,
			user_id: entity.userId,
			created_at: entity.createdAt.toISOString(),
		};
	}
}
