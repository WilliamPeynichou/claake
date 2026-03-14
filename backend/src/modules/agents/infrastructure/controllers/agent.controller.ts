import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CurrentUserType } from "../../../../common/types/current-user.type.js";
import type { CreateAgentDto } from "../../application/dtos/create-agent.dto.js";
import { CreateAgentUseCase } from "../../application/usecases/create-agent.usecase.js";
import { GetAgentUseCase } from "../../application/usecases/get-agent.usecase.js";
import { ListAgentsUseCase } from "../../application/usecases/list-agents.usecase.js";

@Controller("agents")
export class AgentController {
	constructor(
		private readonly listAgents: ListAgentsUseCase,
		private readonly getAgent: GetAgentUseCase,
		private readonly createAgent: CreateAgentUseCase,
	) {}

	@Get()
	async findAll(
		@Query("q") q?: string,
		@Query("category") category?: string,
		@Query("all") all?: string,
	) {
		return this.listAgents.execute({
			q,
			category,
			publishedOnly: all !== "true",
		});
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return this.getAgent.execute(id);
	}

	@Post()
	@UseGuards(SupabaseAuthGuard)
	async create(@Body() dto: CreateAgentDto, @CurrentUser() user: CurrentUserType) {
		return this.createAgent.execute(dto, user.id);
	}
}
