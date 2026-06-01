import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import type { UserRole } from "@prisma/client";
import type { Request } from "express";
import { memoryStorage } from "multer";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { UploadService } from "../../application/upload.service.js";

type AuthenticatedRequest = Request & {
	user: {
		id: string;
		role: UserRole;
	};
};

@Controller("uploads")
@UseGuards(SupabaseAuthGuard)
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post()
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	@UseInterceptors(
		FileInterceptor("file", {
			storage: memoryStorage(),
			limits: { fileSize: 10 * 1024 * 1024 },
		}),
	)
	async upload(
		@UploadedFile() file: Express.Multer.File,
		@Req() req: AuthenticatedRequest,
		@Query("agentId") agentId?: string,
		@Query("sessionId") sessionId?: string,
		@Query("messageId") messageId?: string,
	) {
		if (!file) {
			throw new BadRequestException("Aucun fichier fourni.");
		}
		return this.uploadService.upload(file, req.user.id, { agentId, sessionId, messageId });
	}

	@Get("agent/:agentId")
	async listForAgent(@Param("agentId") agentId: string, @Req() req: AuthenticatedRequest) {
		return this.uploadService.listForAgent(agentId, req.user.id, req.user.role);
	}

	@Get("session/:sessionId")
	async listForSession(@Param("sessionId") sessionId: string, @Req() req: AuthenticatedRequest) {
		return this.uploadService.listForSession(sessionId, req.user.id);
	}

	@Delete(":fileId")
	@HttpCode(204)
	async delete(@Param("fileId") fileId: string, @Req() req: AuthenticatedRequest) {
		await this.uploadService.delete(fileId, req.user.id);
	}
}
