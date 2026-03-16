import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";
import type { CollectionResponseDto } from "../dtos/collection-response.dto.js";
import { CollectionTransformer } from "../transformers/collection.transformer.js";

@Injectable()
export class AddAgentToCollectionUseCase {
	constructor(
		@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort,
	) {}

	async execute(
		collectionId: string,
		agentId: string,
		userId: string,
	): Promise<CollectionResponseDto> {
		const collection = await this.repo.findById(collectionId);
		if (!collection) throw new NotFoundException("Collection not found");
		if (!collection.canBeEditedBy(userId)) throw new ForbiddenException();

		const updated = await this.repo.addAgent(collectionId, agentId);
		return CollectionTransformer.toDto(updated);
	}
}
