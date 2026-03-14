import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { DashboardStatsDto } from "../dtos/stats-response.dto.js";

@Injectable()
export class GetDashboardStatsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string): Promise<DashboardStatsDto> {
		const [publishedCount, avgRating] = await Promise.all([
			this.prisma.agent.count({
				where: { creatorId: userId, status: "APPROVED" },
			}),
			this.prisma.agent.aggregate({
				where: { creatorId: userId, status: "APPROVED" },
				_avg: { rating: true },
			}),
		]);

		const avg = avgRating._avg.rating;
		return {
			agents_used: 0,
			conversations: 0,
			agents_published: publishedCount,
			rating: avg ? Number(avg).toFixed(1) : "—",
		};
	}
}
