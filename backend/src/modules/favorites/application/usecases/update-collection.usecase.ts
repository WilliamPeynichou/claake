import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";
import type { UpdateCollectionDto } from "../dtos/update-collection.dto.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";
import { CollectionTransformer } from "../transformers/collection.transformer.js";

@Injectable()
export class UpdateCollectionUseCase {
	constructor(
		@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort,
	) {}

	async execute(
		id: string,
		dto: UpdateCollectionDto,
		userId: string,
	): Promise<CollectionResponseDto> {
		const collection = await this.repo.findById(id);
		if (!collection) throw new NotFoundException("Collection not found");
		if (!collection.canBeEditedBy(userId)) throw new ForbiddenException();

		const updated = await this.repo.update(id, {
			name: dto.name,
			description: dto.description,
			isPublic: dto.is_public,
		});
		return CollectionTransformer.toDto(updated);
	}
}
