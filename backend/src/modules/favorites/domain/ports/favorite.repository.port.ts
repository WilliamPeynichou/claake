import type { FavoriteEntity } from "../entities/favorite.entity.js";

export const FAVORITE_REPOSITORY = Symbol("FAVORITE_REPOSITORY");

export interface FavoriteRepositoryPort {
	toggle(userId: string, agentId: string): Promise<{ favorited: boolean }>;
	findByUser(userId: string): Promise<FavoriteEntity[]>;
	isFavorited(userId: string, agentId: string): Promise<boolean>;
	isFavoritedBatch(userId: string, agentIds: string[]): Promise<Record<string, boolean>>;
}
