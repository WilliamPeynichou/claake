import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ENCRYPTION_SERVICE } from "./common/ports/encryption.port.js";
import { AesEncryptionService } from "./common/services/aes-encryption.service.js";
import { ActivityModule } from "./modules/activity/activity.module.js";
import { AgentModule } from "./modules/agents/agent.module.js";
import { CategoryModule } from "./modules/categories/category.module.js";
import { ChatModule } from "./modules/chat/chat.module.js";
import { FavoriteModule } from "./modules/favorites/favorite.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { McpModule } from "./modules/mcp/mcp.module.js";
import { NotificationModule } from "./modules/notifications/notification.module.js";
import { PaymentModule } from "./modules/payments/payment.module.js";
import { ReviewModule } from "./modules/reviews/review.module.js";
import { StatsModule } from "./modules/stats/stats.module.js";
import { UploadsModule } from "./modules/uploads/uploads.module.js";
import { UserModule } from "./modules/users/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

function validateEnv(config: Record<string, unknown>) {
	const required = [
		"DATABASE_URL",
		"SUPABASE_URL",
		"SUPABASE_ANON_KEY",
		"SUPABASE_SERVICE_ROLE_KEY",
		"ENCRYPTION_KEY",
	];
	const isProduction = config.NODE_ENV === "production";
	if (isProduction) {
		required.push("WEB_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
	}

	const missing = required.filter((key) => !config[key]);
	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
	}

	const encryptionKey = String(config.ENCRYPTION_KEY ?? "");
	if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
		throw new Error("ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)");
	}

	const webUrl = String(config.WEB_URL ?? "");
	if (isProduction) {
		if (!/^https:\/\//.test(webUrl)) {
			throw new Error("WEB_URL must be an https:// origin in production");
		}
		for (const key of ["SUPABASE_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]) {
			const value = String(config[key] ?? "");
			if (/changeme|example|placeholder|your-/i.test(value)) {
				throw new Error(`${key} must not use a placeholder value in production`);
			}
		}
	}

	return config;
}

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		PrismaModule,
		HealthModule,
		McpModule,
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
		UploadsModule,
	],
	providers: [
		{ provide: ENCRYPTION_SERVICE, useClass: AesEncryptionService },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
	],
	exports: [ENCRYPTION_SERVICE],
})
export class AppModule {}
