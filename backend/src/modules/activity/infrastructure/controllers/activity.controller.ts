import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { ListActivityLogsUseCase } from "../../application/usecases/list-activity-logs.usecase.js";

@Controller("admin/activity")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class ActivityController {
	constructor(private readonly listLogs: ListActivityLogsUseCase) {}

	@Get()
	async findAll(
		@Query("action") action?: string,
		@Query("target_type") targetType?: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
	) {
		return this.listLogs.execute({
			action,
			targetType,
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
		});
	}
}
