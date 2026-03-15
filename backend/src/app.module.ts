import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AgentModule } from "./modules/agents/agent.module.js";
import { CategoryModule } from "./modules/categories/category.module.js";
import { ChatModule } from "./modules/chat/chat.module.js";
import { StatsModule } from "./modules/stats/stats.module.js";
import { UserModule } from "./modules/users/user.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
		PrismaModule,
		AgentModule,
		CategoryModule,
		ChatModule,
		UserModule,
		StatsModule,
	],
})
export class AppModule {}
