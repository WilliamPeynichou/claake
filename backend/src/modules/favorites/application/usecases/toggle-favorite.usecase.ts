import { Inject, Injectable } from "@nestjs/common";
import {
	FAVORITE_REPOSITORY,
	type FavoriteRepositoryPort,
} from "../../domain/ports/favorite.repository.port.js";

@Injectable()
export class ToggleFavoriteUseCase {
	constructor(@Inject(FAVORITE_REPOSITORY) private readonly repo: FavoriteRepositoryPort) {}

	async execute(userId: string, agentId: string): Promise<{ favorited: boolean }> {
		return this.repo.toggle(userId, agentId);
	}
}
