import { Controller, Get, Query } from "@nestjs/common";
import { GetAdminStatsUseCase } from "../../application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "../../application/usecases/get-dashboard-stats.usecase.js";

@Controller("stats")
export class StatsController {
	constructor(
		private readonly getDashboardStats: GetDashboardStatsUseCase,
		private readonly getAdminStats: GetAdminStatsUseCase,
	) {}

	@Get("dashboard")
	async dashboard(@Query("userId") userId?: string) {
		// TODO: extract userId from auth token instead of query param
		return this.getDashboardStats.execute(userId ?? "");
	}

	@Get("admin")
	async admin() {
		return this.getAdminStats.execute();
	}
}
