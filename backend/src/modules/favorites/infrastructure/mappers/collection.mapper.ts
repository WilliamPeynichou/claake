import type { Collection, CollectionAgent } from "@prisma/client";
import { CollectionEntity } from "../../domain/entities/collection.entity.js";

type CollectionWithAgents = Collection & { agents?: CollectionAgent[] };

export class CollectionMapper {
	static toDomain(raw: CollectionWithAgents): CollectionEntity {
		return new CollectionEntity(
			raw.id,
			raw.name,
			raw.description,
			raw.isPublic,
			raw.agents?.map((a) => a.agentId) ?? [],
			raw.userId,
			raw.createdAt,
		);
	}
}
