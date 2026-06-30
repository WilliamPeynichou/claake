import { Inject, Injectable } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";
import { CollectionTransformer } from "../transformers/collection.transformer.js";

@Injectable()
export class ListCollectionsUseCase {
	constructor(@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort) {}

	async execute(userId: string): Promise<CollectionResponseDto[]> {
		const collections = await this.repo.findByUser(userId);
		return collections.map(CollectionTransformer.toDto);
	}
}
