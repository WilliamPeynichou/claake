import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";

@Injectable()
export class ListActivityLogsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(params: { action?: string; targetType?: string; page?: number; limit?: number }) {
		const where: Prisma.ActivityLogWhereInput = {};

		if (params.action) where.action = params.action;
		if (params.targetType) where.targetType = params.targetType;

		const page = params.page ?? 1;
		const limit = Math.min(params.limit ?? 50, 100);
		const skip = (page - 1) * limit;

		const [logs, total] = await Promise.all([
			this.prisma.activityLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			this.prisma.activityLog.count({ where }),
		]);

		return {
			logs: logs.map((log) => ({
				id: log.id,
				actor_id: log.actorId,
				actor_email: log.actorEmail,
				action: log.action,
				target_type: log.targetType,
				target_id: log.targetId,
				metadata: log.metadata,
				created_at: log.createdAt.toISOString(),
			})),
			total,
		};
	}
}
