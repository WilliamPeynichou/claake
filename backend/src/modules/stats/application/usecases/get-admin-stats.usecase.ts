import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { AdminStatsDto } from "../dtos/stats-response.dto.js";

@Injectable()
export class GetAdminStatsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(): Promise<AdminStatsDto> {
		const [publishedAgents, users, pendingReview] = await Promise.all([
			this.prisma.agent.count({ where: { status: "APPROVED" } }),
			this.prisma.user.count(),
			this.prisma.agent.count({ where: { status: "PENDING" } }),
		]);

		return {
			published_agents: publishedAgents,
			users,
			pending_review: pendingReview,
			chat_sessions: 0,
		};
	}
}
