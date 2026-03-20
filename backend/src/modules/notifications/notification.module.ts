import { Global, Module } from "@nestjs/common";
import { EMAIL_SERVICE } from "./domain/email-service.port.js";
import { NotificationService } from "./application/notification.service.js";
import { ConsoleEmailService } from "./infrastructure/console-email.service.js";

@Global()
@Module({
	providers: [
		NotificationService,
		{ provide: EMAIL_SERVICE, useClass: ConsoleEmailService },
	],
	exports: [NotificationService],
})
export class NotificationModule {}
