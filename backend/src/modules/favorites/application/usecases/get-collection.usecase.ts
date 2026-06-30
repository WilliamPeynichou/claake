import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";
import { CollectionTransformer } from "../transformers/collection.transformer.js";

@Injectable()
export class GetCollectionUseCase {
	constructor(@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort) {}

	async execute(id: string, userId?: string): Promise<CollectionResponseDto> {
		const collection = await this.repo.findById(id);
		if (!collection) throw new NotFoundException("Collection not found");
		if (userId && !collection.canBeViewedBy(userId)) throw new ForbiddenException();
		if (!userId && !collection.isPublic) throw new ForbiddenException();

		return CollectionTransformer.toDto(collection);
	}
}
