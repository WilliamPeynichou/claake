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
		const where: Prisma.AgentWhereInput = {};

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

		const [agents, total] = await Promise.all([
			this.prisma.agent.findMany({
				where,
				include: { creator: { select: { displayName: true } } },
				orderBy: { createdAt: "desc" },
			}),
			this.prisma.agent.count({ where }),
		]);

		return {
			agents: agents.map(AgentMapper.toDomain),
			total,
		};
	}

	async findById(id: string): Promise<AgentEntity | null> {
		const agent = await this.prisma.agent.findUnique({
			where: { id },
			include: { creator: { select: { displayName: true } } },
		});
		return agent ? AgentMapper.toDomain(agent) : null;
	}

	async findBySlug(slug: string): Promise<AgentEntity | null> {
		const agent = await this.prisma.agent.findUnique({
			where: { slug },
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
				systemPrompt: data.systemPrompt,
				pricingModel: (data.pricingModel as any) ?? "FREE",
				price: data.price ?? 0,
				creditCost: data.creditCost ?? 1,
				permissions: (data.permissions as any) ?? undefined,
				creatorId: data.creatorId!,
			},
			include: { creator: { select: { displayName: true } } },
		});
		return AgentMapper.toDomain(agent);
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
