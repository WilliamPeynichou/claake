import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CreateAgentDto } from "../../application/dtos/create-agent.dto.js";
import { CreateAgentUseCase } from "../../application/usecases/create-agent.usecase.js";
import { GetAgentUseCase } from "../../application/usecases/get-agent.usecase.js";
import { ListAgentsUseCase } from "../../application/usecases/list-agents.usecase.js";
import { ReviewAgentUseCase } from "../../application/usecases/review-agent.usecase.js";
import { ValidateAgentUseCase } from "../../application/usecases/validate-agent.usecase.js";

@Controller("agents")
export class AgentController {
	constructor(
		private readonly listAgents: ListAgentsUseCase,
		private readonly getAgent: GetAgentUseCase,
		private readonly createAgent: CreateAgentUseCase,
		private readonly validateAgent: ValidateAgentUseCase,
		private readonly reviewAgent: ReviewAgentUseCase,
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

	@Get("mine")
	@UseGuards(SupabaseAuthGuard)
	async findMine(@Req() req: any) {
		return this.listAgents.execute({
			publishedOnly: false,
			creatorId: req.user.id,
		});
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return this.getAgent.execute(id);
	}

	@Post()
	@UseGuards(SupabaseAuthGuard)
	async create(@Body() dto: CreateAgentDto, @Req() req: any) {
		const agent = await this.createAgent.execute(dto, req.user.id);

		// Run validation pipeline
		const validation = await this.validateAgent.execute(agent.id);

		return { ...agent, validation };
	}

	@Patch(":id/review")
	@UseGuards(SupabaseAuthGuard, RolesGuard)
	@Roles("ADMIN", "SUPER_ADMIN")
	async review(
		@Param("id") id: string,
		@Body() body: { decision: "approve" | "reject"; reason?: string },
	) {
		return this.reviewAgent.execute(id, body.decision, body.reason);
	}
}
