import { Inject, Injectable } from "@nestjs/common";
import {
	FAVORITE_REPOSITORY,
	type FavoriteRepositoryPort,
} from "../../domain/ports/favorite.repository.port.js";

@Injectable()
export class CheckFavoriteUseCase {
	constructor(@Inject(FAVORITE_REPOSITORY) private readonly repo: FavoriteRepositoryPort) {}

	async execute(userId: string, agentId: string): Promise<{ favorited: boolean }> {
		const favorited = await this.repo.isFavorited(userId, agentId);
		return { favorited };
	}
}
