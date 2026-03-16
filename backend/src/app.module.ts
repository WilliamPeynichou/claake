import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ENCRYPTION_SERVICE } from "./common/ports/encryption.port.js";
import { AesEncryptionService } from "./common/services/aes-encryption.service.js";
import { ActivityModule } from "./modules/activity/activity.module.js";
import { AgentModule } from "./modules/agents/agent.module.js";
import { CategoryModule } from "./modules/categories/category.module.js";
import { ChatModule } from "./modules/chat/chat.module.js";
import { FavoriteModule } from "./modules/favorites/favorite.module.js";
import { NotificationModule } from "./modules/notifications/notification.module.js";
import { PaymentModule } from "./modules/payments/payment.module.js";
import { ReviewModule } from "./modules/reviews/review.module.js";
import { StatsModule } from "./modules/stats/stats.module.js";
import { UserModule } from "./modules/users/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		PrismaModule,
		ActivityModule,
		AgentModule,
		CategoryModule,
		ChatModule,
		FavoriteModule,
		NotificationModule,
		PaymentModule,
		ReviewModule,
		UserModule,
		StatsModule,
	],
	providers: [{ provide: ENCRYPTION_SERVICE, useClass: AesEncryptionService }],
	exports: [ENCRYPTION_SERVICE],
})
export class AppModule {}
