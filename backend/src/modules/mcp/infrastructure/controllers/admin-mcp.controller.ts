import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { ReviewMcpServerDto } from "../../application/dtos/mcp-review.dto.js";
import { McpServerService } from "../../application/services/mcp-server.service.js";

@Controller("admin/mcp")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class AdminMcpController {
	constructor(private readonly service: McpServerService) {}
	@Get("pending") pending() {
		return this.service.pending();
	}
	@Patch(":id/review") review(
		@Param("id") id: string,
		@Body() dto: ReviewMcpServerDto,
		@Req() req: { user: { id: string } },
	) {
		return this.service.review(id, dto.decision, dto.reason, req.user.id);
	}
}
