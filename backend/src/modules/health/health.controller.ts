import { Controller, Get, HttpCode, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Controller("health")
export class HealthController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	@HttpCode(200)
	async check() {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return { status: "ok" };
		} catch {
			throw new ServiceUnavailableException({ status: "error", detail: "database unreachable" });
		}
	}
}
