import type { CollectionEntity } from "../entities/collection.entity.js";

export const COLLECTION_REPOSITORY = Symbol("COLLECTION_REPOSITORY");

export interface CollectionRepositoryPort {
	create(data: {
		name: string;
		description?: string;
		isPublic?: boolean;
		userId: string;
	}): Promise<CollectionEntity>;
	findById(id: string): Promise<CollectionEntity | null>;
	findByUser(userId: string): Promise<CollectionEntity[]>;
	update(
		id: string,
		data: { name?: string; description?: string; isPublic?: boolean },
	): Promise<CollectionEntity>;
	delete(id: string): Promise<void>;
	addAgent(id: string, agentId: string): Promise<CollectionEntity>;
	removeAgent(id: string, agentId: string): Promise<CollectionEntity>;
}
