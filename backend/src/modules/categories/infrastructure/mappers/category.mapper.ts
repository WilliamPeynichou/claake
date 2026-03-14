import type { Category } from "@prisma/client";
import { CategoryEntity } from "../../domain/entities/category.entity.js";

export class CategoryMapper {
	static toDomain(raw: Category & { agentCount: number }): CategoryEntity {
		return new CategoryEntity(
			raw.id,
			raw.name,
			raw.slug,
			raw.description,
			raw.icon,
			raw.agentCount,
			raw.createdAt,
			raw.updatedAt,
		);
	}
}
