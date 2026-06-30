import { Global, Module } from "@nestjs/common";
import { AdminPermissionGuard } from "../../common/guards/admin-permission.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { ListActivityLogsUseCase } from "./application/usecases/list-activity-logs.usecase.js";
import { ActivityLogService } from "./domain/activity-log.service.js";
import { ActivityController } from "./infrastructure/controllers/activity.controller.js";

@Global()
@Module({
	controllers: [ActivityController],
	providers: [
		ActivityLogService,
		ListActivityLogsUseCase,
		SupabaseAuthGuard,
		RolesGuard,
		AdminPermissionGuard,
	],
	exports: [ActivityLogService],
})
export class ActivityModule {}
