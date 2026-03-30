import {
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
import { memoryStorage } from "multer";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { UploadService } from "../../application/upload.service.js";

@Controller("v1/uploads")
@UseGuards(SupabaseAuthGuard)
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post()
	@UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
	async upload(
		@UploadedFile() file: Express.Multer.File,
		@Query("agentId") agentId?: string,
		@Query("sessionId") sessionId?: string,
		@Query("messageId") messageId?: string,
		@Req() req?: any,
	) {
		return this.uploadService.upload(file, req.user.id, { agentId, sessionId, messageId });
	}

	@Get("agent/:agentId")
	async listForAgent(@Param("agentId") agentId: string) {
		return this.uploadService.listForAgent(agentId);
	}

	@Get("session/:sessionId")
	async listForSession(@Param("sessionId") sessionId: string) {
		return this.uploadService.listForSession(sessionId);
	}

	@Delete(":fileId")
	@HttpCode(204)
	async delete(@Param("fileId") fileId: string, @Req() req: any) {
		await this.uploadService.delete(fileId, req.user.id);
	}
}
