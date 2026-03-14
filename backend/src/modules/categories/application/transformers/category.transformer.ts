import type { CategoryEntity } from "../../domain/entities/category.entity.js";
import type { CategoryResponseDto } from "../dtos/category-response.dto.js";

export class CategoryTransformer {
	static toDto(entity: CategoryEntity): CategoryResponseDto {
		return {
			id: entity.id,
			name: entity.name,
			slug: entity.slug,
			description: entity.description,
			icon: entity.icon,
			agent_count: entity.agentCount,
		};
	}

	static toDtoList(entities: CategoryEntity[]): CategoryResponseDto[] {
		return entities.map((e) => CategoryTransformer.toDto(e));
	}
}
