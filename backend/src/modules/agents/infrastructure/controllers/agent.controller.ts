import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CreateAgentDto } from "../../application/dtos/create-agent.dto.js";
import { CreateAgentUseCase } from "../../application/usecases/create-agent.usecase.js";
import { DeleteAgentUseCase } from "../../application/usecases/delete-agent.usecase.js";
import { GetAgentUseCase } from "../../application/usecases/get-agent.usecase.js";
import { GetAgentDownloadInfoUseCase } from "../../application/usecases/get-agent-download-info.usecase.js";
import { ListAgentsUseCase } from "../../application/usecases/list-agents.usecase.js";
import { ReviewAgentUseCase } from "../../application/usecases/review-agent.usecase.js";
import { UnpublishAgentUseCase } from "../../application/usecases/unpublish-agent.usecase.js";
import { UpdateAgentUseCase } from "../../application/usecases/update-agent.usecase.js";
import { ValidateAgentUseCase } from "../../application/usecases/validate-agent.usecase.js";

@Controller("agents")
export class AgentController {
	constructor(
		private readonly listAgents: ListAgentsUseCase,
		private readonly getAgent: GetAgentUseCase,
		private readonly createAgent: CreateAgentUseCase,
		private readonly updateAgent: UpdateAgentUseCase,
		private readonly validateAgent: ValidateAgentUseCase,
		private readonly reviewAgent: ReviewAgentUseCase,
		private readonly getDownloadInfo: GetAgentDownloadInfoUseCase,
		private readonly deleteAgent: DeleteAgentUseCase,
		private readonly unpublishAgent: UnpublishAgentUseCase,
	) {}

	@Get()
	async findAll(
		@Query("q") q?: string,
		@Query("category") category?: string,
		@Query("all") all?: string,
		@Query("pricing_model") pricingModel?: string,
		@Query("mode") mode?: string,
		@Query("min_rating") minRating?: string,
		@Query("tags") tags?: string,
		@Query("sort_by") sortBy?: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
	) {
		return this.listAgents.execute({
			q,
			category,
			publishedOnly: all !== "true",
			pricingModel,
			mode,
			minRating: minRating ? Number(minRating) : undefined,
			tags: tags ? tags.split(",") : undefined,
			sortBy,
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
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

	@Patch(":id")
	@UseGuards(SupabaseAuthGuard)
	async update(@Param("id") id: string, @Body() dto: Partial<CreateAgentDto>, @Req() req: any) {
		return this.updateAgent.execute(id, dto, req.user.id);
	}

	@Get(":id/download-info")
	@UseGuards(SupabaseAuthGuard)
	async downloadInfo(@Param("id") id: string, @Req() req: any) {
		return this.getDownloadInfo.execute(id, req.user.id);
	}

	@Delete(":id")
	@HttpCode(204)
	@UseGuards(SupabaseAuthGuard)
	async remove(@Param("id") id: string, @Req() req: any) {
		await this.deleteAgent.execute(id, { id: req.user.id, email: req.user.email });
	}

	@Patch(":id/unpublish")
	@UseGuards(SupabaseAuthGuard)
	async unpublish(@Param("id") id: string, @Req() req: any) {
		return this.unpublishAgent.execute(id, { id: req.user.id, email: req.user.email });
	}

	@Patch(":id/review")
	@UseGuards(SupabaseAuthGuard, RolesGuard)
	@Roles("ADMIN", "SUPER_ADMIN")
	async review(
		@Param("id") id: string,
		@Body() body: { decision: "approve" | "reject"; reason?: string },
		@Req() req: any,
	) {
		return this.reviewAgent.execute(id, body.decision, body.reason, {
			id: req.user.id,
			email: req.user.email,
		});
	}
}
