import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { SelectMcpToolsDto } from "../../application/dtos/mcp-review.dto.js";
import { CreateMcpServerDto, UpdateMcpServerDto } from "../../application/dtos/mcp-server.dto.js";
import { McpServerService } from "../../application/services/mcp-server.service.js";

type RequestUser = { id: string; role: string };
@Controller("agents/:agentId/mcp")
@UseGuards(SupabaseAuthGuard)
export class McpServerController {
	constructor(private readonly service: McpServerService) {}
	@Get() list(@Param("agentId") agentId: string, @Req() req: { user: RequestUser }) {
		return this.service.list(agentId, { userId: req.user.id, role: req.user.role });
	}
	@Post() @Throttle({ default: { ttl: 60_000, limit: 10 } }) create(
		@Param("agentId") agentId: string,
		@Body() dto: CreateMcpServerDto,
		@Req() req: { user: RequestUser },
	) {
		return this.service.create(agentId, { userId: req.user.id, role: req.user.role }, dto);
	}
	@Patch(":id") update(
		@Param("agentId") agentId: string,
		@Param("id") id: string,
		@Body() dto: UpdateMcpServerDto,
		@Req() req: { user: RequestUser },
	) {
		return this.service.update(agentId, id, { userId: req.user.id, role: req.user.role }, dto);
	}
	@Delete(":id") @HttpCode(204) remove(
		@Param("agentId") agentId: string,
		@Param("id") id: string,
		@Req() req: { user: RequestUser },
	) {
		return this.service.remove(agentId, id, { userId: req.user.id, role: req.user.role });
	}
	@Post(":id/discover") @Throttle({ default: { ttl: 60_000, limit: 5 } }) discover(
		@Param("agentId") agentId: string,
		@Param("id") id: string,
		@Req() req: { user: RequestUser },
	) {
		return this.service.discover(agentId, id, { userId: req.user.id, role: req.user.role });
	}
	@Patch(":id/tools") select(
		@Param("agentId") agentId: string,
		@Param("id") id: string,
		@Body() dto: SelectMcpToolsDto,
		@Req() req: { user: RequestUser },
	) {
		return this.service.select(
			agentId,
			id,
			{ userId: req.user.id, role: req.user.role },
			dto.tool_ids,
		);
	}
	@Post(":id/submit") submit(
		@Param("agentId") agentId: string,
		@Param("id") id: string,
		@Req() req: { user: RequestUser },
	) {
		return this.service.submit(agentId, id, { userId: req.user.id, role: req.user.role });
	}
}
