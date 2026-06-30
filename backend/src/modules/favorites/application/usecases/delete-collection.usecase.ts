import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	COLLECTION_REPOSITORY,
	type CollectionRepositoryPort,
} from "../../domain/ports/collection.repository.port.js";

@Injectable()
export class DeleteCollectionUseCase {
	constructor(@Inject(COLLECTION_REPOSITORY) private readonly repo: CollectionRepositoryPort) {}

	async execute(id: string, userId: string): Promise<{ deleted: boolean }> {
		const collection = await this.repo.findById(id);
		if (!collection) throw new NotFoundException("Collection not found");
		if (!collection.canBeEditedBy(userId)) throw new ForbiddenException();

		await this.repo.delete(id);
		return { deleted: true };
	}
}
