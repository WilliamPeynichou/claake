import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { ReviewEntity } from "../../domain/entities/review.entity.js";
import type { ReviewRepositoryPort } from "../../domain/ports/review.repository.port.js";

@Injectable()
export class PrismaReviewRepository implements ReviewRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	private toEntity(raw: any & { user?: { displayName: string | null } }): ReviewEntity {
		return new ReviewEntity(
			raw.id,
			raw.userId,
			raw.agentId,
			raw.rating,
			raw.comment,
			raw.verifiedPurchase,
			raw.verifiedInteraction,
			raw.helpfulCount,
			raw.user?.displayName ?? null,
			raw.createdAt,
			raw.updatedAt,
		);
	}

	async create(data: {
		userId: string;
		agentId: string;
		rating: number;
		comment?: string;
		verifiedPurchase: boolean;
		verifiedInteraction: boolean;
	}): Promise<ReviewEntity> {
		const review = await this.prisma.review.create({
			data: {
				userId: data.userId,
				agentId: data.agentId,
				rating: data.rating,
				comment: data.comment,
				verifiedPurchase: data.verifiedPurchase,
				verifiedInteraction: data.verifiedInteraction,
			},
			include: { user: { select: { displayName: true } } },
		});
		return this.toEntity(review);
	}

	async findById(id: string): Promise<ReviewEntity | null> {
		const review = await this.prisma.review.findUnique({
			where: { id },
			include: { user: { select: { displayName: true } } },
		});
		return review ? this.toEntity(review) : null;
	}

	async findByUserAndAgent(userId: string, agentId: string): Promise<ReviewEntity | null> {
		const review = await this.prisma.review.findUnique({
			where: { userId_agentId: { userId, agentId } },
			include: { user: { select: { displayName: true } } },
		});
		return review ? this.toEntity(review) : null;
	}

	async findByAgentId(
		agentId: string,
		page: number,
		limit: number,
	): Promise<{ reviews: ReviewEntity[]; total: number }> {
		const skip = (page - 1) * limit;
		const [reviews, total] = await Promise.all([
			this.prisma.review.findMany({
				where: { agentId },
				include: { user: { select: { displayName: true } } },
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			this.prisma.review.count({ where: { agentId } }),
		]);
		return {
			reviews: reviews.map((r) => this.toEntity(r)),
			total,
		};
	}

	async update(id: string, data: { rating?: number; comment?: string }): Promise<ReviewEntity> {
		const review = await this.prisma.review.update({
			where: { id },
			data: {
				rating: data.rating,
				comment: data.comment,
			},
			include: { user: { select: { displayName: true } } },
		});
		return this.toEntity(review);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.review.delete({ where: { id } });
	}

	async computeAgentStats(agentId: string): Promise<{ avg: number; count: number }> {
		const result = await this.prisma.review.aggregate({
			where: { agentId },
			_avg: { rating: true },
			_count: { rating: true },
		});
		return {
			avg: Math.round((result._avg.rating ?? 0) * 100) / 100,
			count: result._count.rating,
		};
	}
}
