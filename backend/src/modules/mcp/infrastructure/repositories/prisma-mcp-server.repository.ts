import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { McpServerEntity } from "../../domain/entities/mcp-server.entity.js";
import type {
	CreateMcpServerData,
	DiscoveredMcpTool,
	McpServerRepositoryPort,
	UpdateMcpServerData,
} from "../../domain/ports/mcp-server.repository.port.js";

const includeTools = { tools: { orderBy: { name: "asc" as const } } };
type RecordWithTools = Prisma.McpServerGetPayload<{ include: typeof includeTools }>;

@Injectable()
export class PrismaMcpServerRepository implements McpServerRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findByAgent(agentId: string) {
		return (
			await this.prisma.mcpServer.findMany({ where: { agentId }, include: includeTools })
		).map(this.map);
	}

	async findPending() {
		return (
			await this.prisma.mcpServer.findMany({
				where: { reviewStatus: "PENDING" },
				include: includeTools,
				orderBy: { submittedAt: "asc" },
			})
		).map(this.map);
	}

	async findById(id: string) {
		const row = await this.prisma.mcpServer.findUnique({ where: { id }, include: includeTools });
		return row ? this.map(row) : null;
	}

	async create(data: CreateMcpServerData) {
		return this.map(await this.prisma.mcpServer.create({ data, include: includeTools }));
	}

	async update(id: string, data: UpdateMcpServerData) {
		return this.map(
			await this.prisma.mcpServer.update({ where: { id }, data, include: includeTools }),
		);
	}

	async delete(id: string) {
		await this.prisma.mcpServer.delete({ where: { id } });
	}

	async replaceTools(id: string, tools: DiscoveredMcpTool[]) {
		return this.map(
			await this.prisma.$transaction(async (tx) => {
				await tx.mcpTool.deleteMany({ where: { serverId: id } });
				if (tools.length) {
					await tx.mcpTool.createMany({
						data: tools.map((tool) => ({
							serverId: id,
							name: tool.name,
							description: tool.description,
							inputSchema: tool.inputSchema as Prisma.InputJsonValue,
						})),
					});
				}
				return tx.mcpServer.update({
					where: { id },
					data: { reviewStatus: "DRAFT", isActive: false, reviewReason: null },
					include: includeTools,
				});
			}),
		);
	}

	async selectTools(id: string, names: string[]) {
		return this.map(
			await this.prisma.$transaction(async (tx) => {
				await tx.mcpTool.updateMany({ where: { serverId: id }, data: { isSelected: false } });
				await tx.mcpTool.updateMany({
					where: { serverId: id, name: { in: names } },
					data: { isSelected: true },
				});
				return tx.mcpServer.update({
					where: { id },
					data: { reviewStatus: "DRAFT", isActive: false, reviewReason: null },
					include: includeTools,
				});
			}),
		);
	}

	async setReview(id: string, data: Parameters<McpServerRepositoryPort["setReview"]>[1]) {
		const now = new Date();
		return this.map(
			await this.prisma.mcpServer.update({
				where: { id },
				data: {
					reviewStatus: data.status,
					reviewReason: data.reason,
					isActive: data.status === "APPROVED",
					submittedAt: data.status === "PENDING" ? now : undefined,
					reviewedAt: ["APPROVED", "REJECTED", "SUSPENDED"].includes(data.status) ? now : null,
					reviewedBy: data.reviewedBy,
				},
				include: includeTools,
			}),
		);
	}

	private map(row: RecordWithTools): McpServerEntity {
		return { ...row, tools: row.tools.map((tool) => ({ ...tool, inputSchema: tool.inputSchema })) };
	}
}
