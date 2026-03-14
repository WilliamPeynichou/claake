import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { CategoryEntity } from "../../domain/entities/category.entity.js";
import type { CategoryRepositoryPort } from "../../domain/ports/category.repository.port.js";
import { CategoryMapper } from "../mappers/category.mapper.js";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<CategoryEntity[]> {
		const categories = await this.prisma.category.findMany({
			orderBy: { name: "asc" },
		});

		const counts = await this.prisma.agent.groupBy({
			by: ["category"],
			where: { status: "PUBLISHED" },
			_count: { id: true },
		});

		const countMap = new Map(counts.map((c) => [c.category, c._count.id]));

		return categories.map((cat) =>
			CategoryMapper.toDomain({
				...cat,
				agentCount: countMap.get(cat.slug) ?? 0,
			}),
		);
	}
}
