import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { DashboardStatsDto } from "../dtos/stats-response.dto.js";

@Injectable()
export class GetDashboardStatsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string): Promise<DashboardStatsDto> {
		const [publishedCount, avgRating, conversationCount, favoriteCount] = await Promise.all([
			this.prisma.agent.count({
				where: { creatorId: userId, status: "APPROVED" },
			}),
			this.prisma.agent.aggregate({
				where: { creatorId: userId, status: "APPROVED" },
				_avg: { rating: true },
			}),
			this.prisma.chatSession.count({
				where: { userId },
			}),
			this.prisma.favorite.count({
				where: { userId },
			}),
		]);

		const avg = avgRating._avg.rating;
		return {
			agents_used: favoriteCount,
			conversations: conversationCount,
			agents_published: publishedCount,
			rating: avg ? Number(avg).toFixed(1) : "—",
		};
	}
}
