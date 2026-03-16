import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service.js";

export interface LogActivityParams {
	actorId: string;
	actorEmail: string;
	action: string;
	targetType: string;
	targetId: string;
	metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
	constructor(private readonly prisma: PrismaService) {}

	async log(params: LogActivityParams): Promise<void> {
		await this.prisma.activityLog.create({
			data: {
				actorId: params.actorId,
				actorEmail: params.actorEmail,
				action: params.action,
				targetType: params.targetType,
				targetId: params.targetId,
				metadata: (params.metadata as any) ?? undefined,
			},
		});
	}
}
