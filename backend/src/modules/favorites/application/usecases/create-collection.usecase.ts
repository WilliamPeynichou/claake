import { Inject, Injectable } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";
import type { CreateCollectionDto } from "../dtos/create-collection.dto.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";
import { CollectionTransformer } from "../transformers/collection.transformer.js";

@Injectable()
export class CreateCollectionUseCase {
	constructor(
		@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort,
	) {}

	async execute(dto: CreateCollectionDto, userId: string): Promise<CollectionResponseDto> {
		const collection = await this.repo.create({
			name: dto.name,
			description: dto.description,
			isPublic: dto.is_public ?? false,
			userId,
		});
		return CollectionTransformer.toDto(collection);
	}
}
