import { Module } from "@nestjs/common";
import { GetAdminStatsUseCase } from "./application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "./application/usecases/get-dashboard-stats.usecase.js";
import { StatsController } from "./infrastructure/controllers/stats.controller.js";

@Module({
	controllers: [StatsController],
	providers: [GetDashboardStatsUseCase, GetAdminStatsUseCase],
})
export class StatsModule {}
