import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { CollectionEntity } from "../../domain/entities/collection.entity.js";
import type { CollectionRepositoryPort } from "../../domain/ports/collection.repository.port.js";
import { CollectionMapper } from "../mappers/collection.mapper.js";

@Injectable()
export class PrismaCollectionRepository implements CollectionRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async create(data: {
		name: string;
		description?: string;
		isPublic?: boolean;
		userId: string;
	}): Promise<CollectionEntity> {
		const collection = await this.prisma.collection.create({
			data: {
				name: data.name,
				description: data.description,
				isPublic: data.isPublic ?? false,
				userId: data.userId,
			},
		});
		return CollectionMapper.toDomain(collection);
	}

	async findById(id: string): Promise<CollectionEntity | null> {
		const collection = await this.prisma.collection.findUnique({ where: { id } });
		return collection ? CollectionMapper.toDomain(collection) : null;
	}

	async findByUser(userId: string): Promise<CollectionEntity[]> {
		const collections = await this.prisma.collection.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		return collections.map(CollectionMapper.toDomain);
	}

	async update(
		id: string,
		data: { name?: string; description?: string; isPublic?: boolean },
	): Promise<CollectionEntity> {
		const collection = await this.prisma.collection.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				isPublic: data.isPublic,
			},
		});
		return CollectionMapper.toDomain(collection);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.collection.delete({ where: { id } });
	}

	async addAgent(id: string, agentId: string): Promise<CollectionEntity> {
		const collection = await this.prisma.collection.update({
			where: { id },
			data: {
				agentIds: { push: agentId },
			},
		});
		return CollectionMapper.toDomain(collection);
	}

	async removeAgent(id: string, agentId: string): Promise<CollectionEntity> {
		const current = await this.prisma.collection.findUniqueOrThrow({ where: { id } });
		const collection = await this.prisma.collection.update({
			where: { id },
			data: {
				agentIds: current.agentIds.filter((aid) => aid !== agentId),
			},
		});
		return CollectionMapper.toDomain(collection);
	}
}
