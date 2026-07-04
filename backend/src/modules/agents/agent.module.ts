import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminPermissionGuard } from "../../common/guards/admin-permission.guard.js";
import { OptionalSupabaseAuthGuard } from "../../common/guards/optional-supabase-auth.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { CreateAgentUseCase } from "./application/usecases/create-agent.usecase.js";
import { DeleteAgentUseCase } from "./application/usecases/delete-agent.usecase.js";
import { GetAgentUseCase } from "./application/usecases/get-agent.usecase.js";
import { GetAgentChatConfigUseCase } from "./application/usecases/get-agent-chat-config.usecase.js";
import { GetAgentDownloadInfoUseCase } from "./application/usecases/get-agent-download-info.usecase.js";
import { ListAgentsUseCase } from "./application/usecases/list-agents.usecase.js";
import { ReviewAgentUseCase } from "./application/usecases/review-agent.usecase.js";
import { SubmitAgentForReviewUseCase } from "./application/usecases/submit-agent-for-review.usecase.js";
import { UnpublishAgentUseCase } from "./application/usecases/unpublish-agent.usecase.js";
import { UpdateAgentUseCase } from "./application/usecases/update-agent.usecase.js";
import { ValidateAgentUseCase } from "./application/usecases/validate-agent.usecase.js";
import { AGENT_REPOSITORY } from "./domain/ports/agent.repository.port.js";
import { AgentController } from "./infrastructure/controllers/agent.controller.js";
import { PrismaAgentRepository } from "./infrastructure/repositories/prisma-agent.repository.js";

@Module({
	controllers: [AgentController],
	providers: [
		Reflector,
		SupabaseAuthGuard,
		OptionalSupabaseAuthGuard,
		RolesGuard,
		AdminPermissionGuard,
		ListAgentsUseCase,
		GetAgentUseCase,
		GetAgentChatConfigUseCase,
		CreateAgentUseCase,
		UpdateAgentUseCase,
		ValidateAgentUseCase,
		SubmitAgentForReviewUseCase,
		ReviewAgentUseCase,
		GetAgentDownloadInfoUseCase,
		DeleteAgentUseCase,
		UnpublishAgentUseCase,
		{ provide: AGENT_REPOSITORY, useClass: PrismaAgentRepository },
	],
	exports: [AGENT_REPOSITORY],
})
export class AgentModule {}
