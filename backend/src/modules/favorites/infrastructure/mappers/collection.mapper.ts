import type { Collection } from "@prisma/client";
import { CollectionEntity } from "../../domain/entities/collection.entity.js";

export class CollectionMapper {
	static toDomain(raw: Collection): CollectionEntity {
		return new CollectionEntity(
			raw.id,
			raw.name,
			raw.description,
			raw.isPublic,
			raw.agentIds,
			raw.userId,
			raw.createdAt,
		);
	}
}
