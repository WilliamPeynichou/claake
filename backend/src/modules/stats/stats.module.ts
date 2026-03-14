import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { GetAdminStatsUseCase } from "./application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "./application/usecases/get-dashboard-stats.usecase.js";
import { StatsController } from "./infrastructure/controllers/stats.controller.js";

@Module({
	imports: [AuthModule],
	controllers: [StatsController],
	providers: [GetDashboardStatsUseCase, GetAdminStatsUseCase],
})
export class StatsModule {}
