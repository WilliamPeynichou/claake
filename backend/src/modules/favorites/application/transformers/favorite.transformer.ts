import type { FavoriteEntity } from "../../domain/entities/favorite.entity.js";
import type { FavoriteResponseDto } from "../dtos/favorite-response.dto.js";

export class FavoriteTransformer {
	static toDto(entity: FavoriteEntity): FavoriteResponseDto {
		return {
			id: entity.id,
			user_id: entity.userId,
			agent_id: entity.agentId,
			created_at: entity.createdAt.toISOString(),
		};
	}
}
