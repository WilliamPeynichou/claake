import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CreateAgentUseCase } from "./application/usecases/create-agent.usecase.js";
import { GetAgentUseCase } from "./application/usecases/get-agent.usecase.js";
import { ListAgentsUseCase } from "./application/usecases/list-agents.usecase.js";
import { AGENT_REPOSITORY } from "./domain/ports/agent.repository.port.js";
import { AgentController } from "./infrastructure/controllers/agent.controller.js";
import { PrismaAgentRepository } from "./infrastructure/repositories/prisma-agent.repository.js";

@Module({
	imports: [AuthModule],
	controllers: [AgentController],
	providers: [
		ListAgentsUseCase,
		GetAgentUseCase,
		CreateAgentUseCase,
		{ provide: AGENT_REPOSITORY, useClass: PrismaAgentRepository },
	],
	exports: [AGENT_REPOSITORY],
})
export class AgentModule {}
