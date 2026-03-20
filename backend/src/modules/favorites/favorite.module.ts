import { Module } from "@nestjs/common";
import { AddAgentToCollectionUseCase } from "./application/usecases/add-agent-to-collection.usecase.js";
import { CheckFavoriteUseCase } from "./application/usecases/check-favorite.usecase.js";
import { CreateCollectionUseCase } from "./application/usecases/create-collection.usecase.js";
import { DeleteCollectionUseCase } from "./application/usecases/delete-collection.usecase.js";
import { GetCollectionUseCase } from "./application/usecases/get-collection.usecase.js";
import { ListCollectionsUseCase } from "./application/usecases/list-collections.usecase.js";
import { ListFavoritesUseCase } from "./application/usecases/list-favorites.usecase.js";
import { RemoveAgentFromCollectionUseCase } from "./application/usecases/remove-agent-from-collection.usecase.js";
import { ToggleFavoriteUseCase } from "./application/usecases/toggle-favorite.usecase.js";
import { UpdateCollectionUseCase } from "./application/usecases/update-collection.usecase.js";
import { COLLECTION_REPOSITORY } from "./domain/ports/collection.repository.port.js";
import { FAVORITE_REPOSITORY } from "./domain/ports/favorite.repository.port.js";
import { CollectionController } from "./infrastructure/controllers/collection.controller.js";
import { FavoriteController } from "./infrastructure/controllers/favorite.controller.js";
import { PrismaCollectionRepository } from "./infrastructure/repositories/prisma-collection.repository.js";
import { PrismaFavoriteRepository } from "./infrastructure/repositories/prisma-favorite.repository.js";

@Module({
	controllers: [FavoriteController, CollectionController],
	providers: [
		ToggleFavoriteUseCase,
		ListFavoritesUseCase,
		CheckFavoriteUseCase,
		CreateCollectionUseCase,
		UpdateCollectionUseCase,
		DeleteCollectionUseCase,
		GetCollectionUseCase,
		ListCollectionsUseCase,
		AddAgentToCollectionUseCase,
		RemoveAgentFromCollectionUseCase,
		{ provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
		{ provide: COLLECTION_REPOSITORY, useClass: PrismaCollectionRepository },
	],
	exports: [FAVORITE_REPOSITORY],
})
export class FavoriteModule {}
