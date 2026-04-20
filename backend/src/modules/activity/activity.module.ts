import { Global, Module } from "@nestjs/common";
import { ListActivityLogsUseCase } from "./application/usecases/list-activity-logs.usecase.js";
import { ActivityLogService } from "./domain/activity-log.service.js";
import { ActivityController } from "./infrastructure/controllers/activity.controller.js";

@Global()
@Module({
	controllers: [ActivityController],
	providers: [ActivityLogService, ListActivityLogsUseCase],
	exports: [ActivityLogService],
})
export class ActivityModule {}
