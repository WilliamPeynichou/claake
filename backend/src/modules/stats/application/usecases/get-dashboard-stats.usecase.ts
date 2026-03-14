import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { DashboardStatsDto } from "../dtos/stats-response.dto.js";

@Injectable()
export class GetDashboardStatsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string): Promise<DashboardStatsDto> {
		const [publishedCount, avgRating] = await Promise.all([
			this.prisma.agent.count({
				where: { creatorId: userId, status: "PUBLISHED" },
			}),
			this.prisma.agent.aggregate({
				where: { creatorId: userId, status: "PUBLISHED" },
				_avg: { averageRating: true },
			}),
		]);

		const avg = avgRating._avg.averageRating;
		return {
			agents_used: 0,
			conversations: 0,
			agents_published: publishedCount,
			average_rating: avg ? avg.toFixed(1) : "—",
		};
	}
}
