import type { Favorite } from "@prisma/client";
import { FavoriteEntity } from "../../domain/entities/favorite.entity.js";

export class FavoriteMapper {
	static toDomain(raw: Favorite): FavoriteEntity {
		return new FavoriteEntity(raw.id, raw.userId, raw.agentId, raw.createdAt);
	}
}
