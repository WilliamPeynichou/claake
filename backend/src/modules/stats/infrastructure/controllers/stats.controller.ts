import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { RequirePermission } from "../../../../common/decorators/admin-permission.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { AdminPermissionGuard } from "../../../../common/guards/admin-permission.guard.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { GetAdminStatsUseCase } from "../../application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "../../application/usecases/get-dashboard-stats.usecase.js";

@Controller("stats")
export class StatsController {
	constructor(
		private readonly getDashboardStats: GetDashboardStatsUseCase,
		private readonly getAdminStats: GetAdminStatsUseCase,
	) {}

	@Get("dashboard")
	@UseGuards(SupabaseAuthGuard)
	async dashboard(@Req() req: any) {
		return this.getDashboardStats.execute(req.user.id);
	}

	@Get("admin")
	@UseGuards(SupabaseAuthGuard, RolesGuard, AdminPermissionGuard)
	@Roles("ADMIN", "SUPER_ADMIN")
	@RequirePermission("canViewStats")
	async admin() {
		return this.getAdminStats.execute();
	}
}
