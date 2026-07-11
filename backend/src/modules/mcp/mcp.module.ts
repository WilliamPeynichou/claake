import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { McpServerService } from "./application/services/mcp-server.service.js";
import { MCP_SERVER_REPOSITORY } from "./domain/ports/mcp-server.repository.port.js";
import { MCP_TOOL_PORT } from "./domain/ports/mcp-tool.port.js";
import { AdminMcpController } from "./infrastructure/controllers/admin-mcp.controller.js";
import { McpServerController } from "./infrastructure/controllers/mcp-server.controller.js";
import { PrismaMcpServerRepository } from "./infrastructure/repositories/prisma-mcp-server.repository.js";
import { McpToolService } from "./infrastructure/services/mcp-tool.service.js";
import { McpHttpClient } from "./infrastructure/transport/mcp-http.client.js";

@Module({
	controllers: [McpServerController, AdminMcpController],
	providers: [
		Reflector,
		SupabaseAuthGuard,
		RolesGuard,
		McpHttpClient,
		McpServerService,
		McpToolService,
		{ provide: MCP_TOOL_PORT, useExisting: McpToolService },
		{ provide: MCP_SERVER_REPOSITORY, useClass: PrismaMcpServerRepository },
	],
	exports: [MCP_TOOL_PORT, McpServerService, McpHttpClient, MCP_SERVER_REPOSITORY],
})
export class McpModule {}
