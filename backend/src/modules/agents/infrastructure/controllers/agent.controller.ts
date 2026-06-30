import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RequirePermission } from "../../../../common/decorators/admin-permission.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { AdminPermissionGuard } from "../../../../common/guards/admin-permission.guard.js";
import { OptionalSupabaseAuthGuard } from "../../../../common/guards/optional-supabase-auth.guard.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { CreateAgentDto } from "../../application/dtos/create-agent.dto.js";
import { ReviewAgentDto } from "../../application/dtos/review-agent.dto.js";
import { UpdateAgentDto } from "../../application/dtos/update-agent.dto.js";
import { CreateAgentUseCase } from "../../application/usecases/create-agent.usecase.js";
import { DeleteAgentUseCase } from "../../application/usecases/delete-agent.usecase.js";
import { GetAgentChatConfigUseCase } from "../../application/usecases/get-agent-chat-config.usecase.js";
import { GetAgentUseCase } from "../../application/usecases/get-agent.usecase.js";
import { GetAgentDownloadInfoUseCase } from "../../application/usecases/get-agent-download-info.usecase.js";
import { ListAgentsUseCase } from "../../application/usecases/list-agents.usecase.js";
import { ReviewAgentUseCase } from "../../application/usecases/review-agent.usecase.js";
import { UnpublishAgentUseCase } from "../../application/usecases/unpublish-agent.usecase.js";
import { UpdateAgentUseCase } from "../../application/usecases/update-agent.usecase.js";
import { ValidateAgentUseCase } from "../../application/usecases/validate-agent.usecase.js";

type RequestUser = { id: string; email: string; role: string };

@Controller("agents")
export class AgentController {
	constructor(
		private readonly listAgents: ListAgentsUseCase,
		private readonly getAgent: GetAgentUseCase,
		private readonly getAgentChatConfig: GetAgentChatConfigUseCase,
		private readonly createAgent: CreateAgentUseCase,
		private readonly updateAgent: UpdateAgentUseCase,
		private readonly validateAgent: ValidateAgentUseCase,
		private readonly reviewAgent: ReviewAgentUseCase,
		private readonly getDownloadInfo: GetAgentDownloadInfoUseCase,
		private readonly deleteAgent: DeleteAgentUseCase,
		private readonly unpublishAgent: UnpublishAgentUseCase,
		private readonly prisma: PrismaService,
	) {}

	@Get()
	@UseGuards(OptionalSupabaseAuthGuard)
	async findAll(
		@Req() req: { user?: RequestUser },
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
		const includeUnpublished = all === "true";
		if (includeUnpublished && !(await this.canManageAgents(req.user))) {
			throw new ForbiddenException("Admin access required to list unpublished agents");
		}

		return this.listAgents.execute({
			q,
			category,
			publishedOnly: !includeUnpublished,
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
	async findMine(@Req() req: { user: RequestUser }) {
		return this.listAgents.execute({
			publishedOnly: false,
			creatorId: req.user.id,
		});
	}

	@Get(":id/chat-config")
	@UseGuards(OptionalSupabaseAuthGuard)
	async chatConfig(@Param("id") id: string, @Req() req: { user?: RequestUser }) {
		return this.getAgentChatConfig.execute(id, req.user);
	}

	@Get(":id")
	@UseGuards(OptionalSupabaseAuthGuard)
	async findOne(@Param("id") id: string, @Req() req: { user?: RequestUser }) {
		const agent = await this.getAgent.execute(id);
		const canView =
			agent.status === "approved" ||
			agent.creator_id === req.user?.id ||
			(await this.canManageAgents(req.user));
		if (!canView) {
			throw new NotFoundException(`Agent ${id} not found`);
		}
		return agent;
	}

	@Post()
	@UseGuards(SupabaseAuthGuard)
	@Throttle({ default: { ttl: 60_000, limit: 10 } })
	async create(@Body() dto: CreateAgentDto, @Req() req: { user: RequestUser }) {
		const agent = await this.createAgent.execute(dto, req.user.id);

		// Run validation pipeline
		const validation = await this.validateAgent.execute(agent.id);

		return { ...agent, validation };
	}

	@Patch(":id")
	@UseGuards(SupabaseAuthGuard)
	@Throttle({ default: { ttl: 60_000, limit: 20 } })
	async update(
		@Param("id") id: string,
		@Body() dto: UpdateAgentDto,
		@Req() req: { user: RequestUser },
	) {
		return this.updateAgent.execute(id, dto, req.user.id);
	}

	@Get(":id/download-info")
	@UseGuards(SupabaseAuthGuard)
	async downloadInfo(@Param("id") id: string, @Req() req: { user: RequestUser }) {
		return this.getDownloadInfo.execute(id, req.user.id);
	}

	@Delete(":id")
	@HttpCode(204)
	@UseGuards(SupabaseAuthGuard)
	async remove(@Param("id") id: string, @Req() req: { user: RequestUser }) {
		await this.deleteAgent.execute(id, { id: req.user.id, email: req.user.email });
	}

	@Patch(":id/unpublish")
	@UseGuards(SupabaseAuthGuard)
	async unpublish(@Param("id") id: string, @Req() req: { user: RequestUser }) {
		return this.unpublishAgent.execute(id, { id: req.user.id, email: req.user.email });
	}

	@Patch(":id/review")
	@UseGuards(SupabaseAuthGuard, RolesGuard, AdminPermissionGuard)
	@Roles("ADMIN", "SUPER_ADMIN")
	@RequirePermission("canManageAgents")
	async review(
		@Param("id") id: string,
		@Body() body: ReviewAgentDto,
		@Req() req: { user: RequestUser },
	) {
		return this.reviewAgent.execute(id, body.decision, body.reason, {
			id: req.user.id,
			email: req.user.email,
		});
	}

	private async canManageAgents(user?: RequestUser): Promise<boolean> {
		if (user?.role === "SUPER_ADMIN") return true;
		if (user?.role !== "ADMIN") return false;

		const dbUser = await this.prisma.user.findUnique({
			where: { id: user.id },
			select: { adminPermissions: true },
		});
		const permissions = dbUser?.adminPermissions as { canManageAgents?: boolean } | null;
		return permissions?.canManageAgents === true;
	}
}
