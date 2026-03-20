import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { CreateAgentUseCase } from "./application/usecases/create-agent.usecase.js";
import { GetAgentDownloadInfoUseCase } from "./application/usecases/get-agent-download-info.usecase.js";
import { GetAgentUseCase } from "./application/usecases/get-agent.usecase.js";
import { ListAgentsUseCase } from "./application/usecases/list-agents.usecase.js";
import { ReviewAgentUseCase } from "./application/usecases/review-agent.usecase.js";
import { UpdateAgentUseCase } from "./application/usecases/update-agent.usecase.js";
import { ValidateAgentUseCase } from "./application/usecases/validate-agent.usecase.js";
import { AGENT_REPOSITORY } from "./domain/ports/agent.repository.port.js";
import { AgentController } from "./infrastructure/controllers/agent.controller.js";
import { PrismaAgentRepository } from "./infrastructure/repositories/prisma-agent.repository.js";

@Module({
	controllers: [AgentController],
	providers: [
		SupabaseAuthGuard,
		RolesGuard,
		ListAgentsUseCase,
		GetAgentUseCase,
		CreateAgentUseCase,
		UpdateAgentUseCase,
		ValidateAgentUseCase,
		ReviewAgentUseCase,
		GetAgentDownloadInfoUseCase,
		{ provide: AGENT_REPOSITORY, useClass: PrismaAgentRepository },
	],
	exports: [AGENT_REPOSITORY],
})
export class AgentModule {}
