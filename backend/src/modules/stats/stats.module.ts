import { Module } from "@nestjs/common";
import { AdminPermissionGuard } from "../../common/guards/admin-permission.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { GetAdminStatsUseCase } from "./application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "./application/usecases/get-dashboard-stats.usecase.js";
import { StatsController } from "./infrastructure/controllers/stats.controller.js";

@Module({
	controllers: [StatsController],
	providers: [
		GetDashboardStatsUseCase,
		GetAdminStatsUseCase,
		SupabaseAuthGuard,
		RolesGuard,
		AdminPermissionGuard,
	],
})
export class StatsModule {}
