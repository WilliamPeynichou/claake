import { Inject, Injectable } from "@nestjs/common";
import {
	FAVORITE_REPOSITORY,
	type FavoriteRepositoryPort,
} from "../../domain/ports/favorite.repository.port.js";
import type { FavoriteResponseDto } from "../dtos/favorite-response.dto.js";
import { FavoriteTransformer } from "../transformers/favorite.transformer.js";

@Injectable()
export class ListFavoritesUseCase {
	constructor(@Inject(FAVORITE_REPOSITORY) private readonly repo: FavoriteRepositoryPort) {}

	async execute(userId: string): Promise<FavoriteResponseDto[]> {
		const favorites = await this.repo.findByUser(userId);
		return favorites.map(FavoriteTransformer.toDto);
	}
}
