import type { Agent, User } from "@prisma/client";
import { AgentEntity } from "../../domain/entities/agent.entity.js";

type AgentWithCreator = Agent & { creator: Pick<User, "displayName"> };

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
			raw.models,
			raw.mode,
			raw.configUrl,
			raw.imageUrl,
			raw.screenshots,
			raw.pricingModel,
			Number(raw.price),
			raw.creditCost,
			raw.status,
			raw.permissions as Record<string, unknown> | null,
			raw.downloadCount,
			Number(raw.rating),
			raw.reviewCount,
			raw.creatorId,
			raw.creator.displayName,
			raw.createdAt,
			raw.updatedAt,
			raw.systemPrompt,
		);
	}
}
