import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { AgentEntity } from "../../domain/entities/agent.entity.js";
import type {
	AgentListParams,
	AgentRepositoryPort,
} from "../../domain/ports/agent.repository.port.js";
import { AgentMapper } from "../mappers/agent.mapper.js";

@Injectable()
export class PrismaAgentRepository implements AgentRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(params: AgentListParams): Promise<{ agents: AgentEntity[]; total: number }> {
		const where: Prisma.AgentWhereInput = { deletedAt: null };

		if (params.creatorId) {
			where.creatorId = params.creatorId;
		} else if (params.publishedOnly !== false) {
			where.status = "APPROVED";
		}

		if (params.category && params.category !== "all") {
			where.category = params.category;
		}

		if (params.q) {
			const q = params.q.toLowerCase();
			where.OR = [
				{ name: { contains: q, mode: "insensitive" } },
				{ description: { contains: q, mode: "insensitive" } },
				{ tags: { hasSome: [q] } },
			];
		}

		if (params.pricingModel) {
			where.pricingModel = params.pricingModel.toUpperCase() as any;
		}

		if (params.mode) {
			where.mode = params.mode.toUpperCase() as any;
		}

		if (params.minRating !== undefined && params.minRating > 0) {
			where.rating = { gte: params.minRating };
		}

		if (params.tags?.length) {
			where.tags = { hasSome: params.tags };
		}

		let orderBy: Prisma.AgentOrderByWithRelationInput;
		switch (params.sortBy) {
			case "popularity":
				orderBy = { downloadCount: "desc" };
				break;
			case "rating":
				orderBy = { rating: "desc" };
				break;
			case "newest":
			default:
				orderBy = { createdAt: "desc" };
				break;
		}

		const page = params.page ?? 1;
		const limit = Math.min(params.limit ?? 50, 100);
		const skip = (page - 1) * limit;

		const [agents, total] = await Promise.all([
			this.prisma.agent.findMany({
				where,
				include: { creator: { select: { displayName: true } } },
				orderBy,
				skip,
				take: limit,
			}),
			this.prisma.agent.count({ where }),
		]);

		return {
			agents: agents.map(AgentMapper.toDomain),
			total,
		};
	}

	async findById(id: string): Promise<AgentEntity | null> {
		const agent = await this.prisma.agent.findFirst({
			where: { id, deletedAt: null },
			include: { creator: { select: { displayName: true } } },
		});
		return agent ? AgentMapper.toDomain(agent) : null;
	}

	async findBySlug(slug: string): Promise<AgentEntity | null> {
		const agent = await this.prisma.agent.findFirst({
			where: { slug, deletedAt: null },
			include: { creator: { select: { displayName: true } } },
		});
		return agent ? AgentMapper.toDomain(agent) : null;
	}

	async create(data: Partial<AgentEntity>): Promise<AgentEntity> {
		const agent = await this.prisma.agent.create({
			data: {
				name: data.name!,
				slug: data.slug!,
				description: data.description!,
				longDescription: data.longDescription,
				category: data.category!,
				tags: data.tags ?? [],
				models: data.models ?? ["claude-sonnet-4-20250514"],
				mode: (data.mode as any) ?? "CLOUD",
				configUrl: data.configUrl,
				imageUrl: data.imageUrl,
				systemPrompt: data.systemPrompt,
				pricingModel: (data.pricingModel as any) ?? "FREE",
				price: data.price ?? 0,
				creditCost: data.creditCost ?? 1,
				permissions: (data.permissions as any) ?? undefined,
				creatorId: data.creatorId!,
				cloudStrategy: (data.cloudStrategy as any) ?? undefined,
				endpointUrl: data.endpointUrl,
				endpointFormat: (data.endpointFormat as any) ?? undefined,
				sellerApiKeyEncrypted: data.sellerApiKeyEncrypted,
				sellerApiProvider: data.sellerApiProvider,
				requiredUserProvider: data.requiredUserProvider,
				dockerImage: data.dockerImage,
				downloadUrl: data.downloadUrl,
			},
			include: { creator: { select: { displayName: true } } },
		});
		return AgentMapper.toDomain(agent);
	}

	async update(id: string, data: Partial<AgentEntity>): Promise<AgentEntity> {
		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.slug !== undefined) updateData.slug = data.slug;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.longDescription !== undefined) updateData.longDescription = data.longDescription;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.tags !== undefined) updateData.tags = data.tags;
		if (data.models !== undefined) updateData.models = data.models;
		if (data.mode !== undefined) updateData.mode = data.mode;
		if (data.configUrl !== undefined) updateData.configUrl = data.configUrl;
		if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
		if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
		if (data.pricingModel !== undefined) updateData.pricingModel = data.pricingModel;
		if (data.cloudStrategy !== undefined) updateData.cloudStrategy = data.cloudStrategy;
		if (data.endpointUrl !== undefined) updateData.endpointUrl = data.endpointUrl;
		if (data.endpointFormat !== undefined) updateData.endpointFormat = data.endpointFormat;
		if (data.sellerApiKeyEncrypted !== undefined)
			updateData.sellerApiKeyEncrypted = data.sellerApiKeyEncrypted;
		if (data.sellerApiProvider !== undefined) updateData.sellerApiProvider = data.sellerApiProvider;
		if (data.requiredUserProvider !== undefined)
			updateData.requiredUserProvider = data.requiredUserProvider;
		if (data.dockerImage !== undefined) updateData.dockerImage = data.dockerImage;
		if (data.downloadUrl !== undefined) updateData.downloadUrl = data.downloadUrl;

		const agent = await this.prisma.agent.update({
			where: { id },
			data: updateData,
			include: { creator: { select: { displayName: true } } },
		});
		return AgentMapper.toDomain(agent);
	}

	async updateRating(id: string, rating: number, reviewCount: number): Promise<void> {
		await this.prisma.agent.update({
			where: { id },
			data: { rating, reviewCount },
		});
	}

	async softDelete(id: string): Promise<void> {
		await this.prisma.agent.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async hasPurchased(userId: string, agentId: string): Promise<boolean> {
		const purchase = await this.prisma.purchase.findUnique({
			where: { userId_agentId: { userId, agentId } },
			select: { id: true },
		});
		return purchase !== null;
	}

	async hasActiveSubscription(userId: string, agentId: string): Promise<boolean> {
		const sub = await this.prisma.subscription.findFirst({
			where: { userId, agentId, status: "ACTIVE" },
			select: { id: true },
		});
		return sub !== null;
	}

	async updateStatus(id: string, status: string, scanStatus?: string): Promise<void> {
		await this.prisma.agent.update({
			where: { id },
			data: {
				status: status as any,
			},
		});

		if (scanStatus) {
			// Update the latest version's scan status
			const latestVersion = await this.prisma.agentVersion.findFirst({
				where: { agentId: id },
				orderBy: { createdAt: "desc" },
			});
			if (latestVersion) {
				await this.prisma.agentVersion.update({
					where: { id: latestVersion.id },
					data: { securityScanStatus: scanStatus as any },
				});
			}
		}
	}
}
