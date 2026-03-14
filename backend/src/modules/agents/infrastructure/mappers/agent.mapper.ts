import type { Agent, User } from "@prisma/client";
import { AgentEntity } from "../../domain/entities/agent.entity.js";

type AgentWithCreator = Agent & { creator: Pick<User, "fullName"> };

export class AgentMapper {
	static toDomain(raw: AgentWithCreator): AgentEntity {
		return new AgentEntity(
			raw.id,
			raw.name,
			raw.slug,
			raw.description,
			raw.longDescription,
			raw.category,
			raw.tags,
			raw.price,
			raw.priceType,
			raw.imageUrl,
			raw.screenshots,
			raw.creatorId,
			raw.creator.fullName,
			raw.model,
			raw.mode,
			raw.version,
			raw.status,
			raw.downloadsCount,
			raw.averageRating,
			raw.reviewsCount,
			raw.sandboxUses,
			raw.createdAt,
			raw.updatedAt,
		);
	}
}
