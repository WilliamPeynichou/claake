import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { FavoriteEntity } from "../../domain/entities/favorite.entity.js";
import type { FavoriteRepositoryPort } from "../../domain/ports/favorite.repository.port.js";
import { FavoriteMapper } from "../mappers/favorite.mapper.js";

@Injectable()
export class PrismaFavoriteRepository implements FavoriteRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async toggle(userId: string, agentId: string): Promise<{ favorited: boolean }> {
		const existing = await this.prisma.favorite.findUnique({
			where: { userId_agentId: { userId, agentId } },
		});

		if (existing) {
			await this.prisma.favorite.delete({ where: { id: existing.id } });
			return { favorited: false };
		}

		await this.prisma.favorite.create({ data: { userId, agentId } });
		return { favorited: true };
	}

	async findByUser(userId: string): Promise<FavoriteEntity[]> {
		const favorites = await this.prisma.favorite.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		return favorites.map(FavoriteMapper.toDomain);
	}

	async isFavorited(userId: string, agentId: string): Promise<boolean> {
		const fav = await this.prisma.favorite.findUnique({
			where: { userId_agentId: { userId, agentId } },
		});
		return fav !== null;
	}

	async isFavoritedBatch(userId: string, agentIds: string[]): Promise<Record<string, boolean>> {
		const favorites = await this.prisma.favorite.findMany({
			where: { userId, agentId: { in: agentIds } },
			select: { agentId: true },
		});
		const favSet = new Set(favorites.map((f) => f.agentId));
		const result: Record<string, boolean> = {};
		for (const id of agentIds) {
			result[id] = favSet.has(id);
		}
		return result;
	}
}
