import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CurrentUserType } from "../../../../common/types/current-user.type.js";
import { GetAdminStatsUseCase } from "../../application/usecases/get-admin-stats.usecase.js";
import { GetDashboardStatsUseCase } from "../../application/usecases/get-dashboard-stats.usecase.js";

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller("stats")
export class StatsController {
	constructor(
		private readonly getDashboardStats: GetDashboardStatsUseCase,
		private readonly getAdminStats: GetAdminStatsUseCase,
	) {}

	@Get("dashboard")
	async dashboard(@CurrentUser() user: CurrentUserType) {
		return this.getDashboardStats.execute(user.id);
	}

	@Get("admin")
	@Roles("ADMIN")
	async admin() {
		return this.getAdminStats.execute();
	}
}
