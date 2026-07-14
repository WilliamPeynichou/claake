import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { RATE_LIMITS } from "../../../../common/config/rate-limits.js";
import { SkipTransform } from "../../../../common/decorators/skip-transform.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { UploadService } from "../../../uploads/application/upload.service.js";
import { CreateSessionDto } from "../../application/dtos/create-session.dto.js";
import { SendMessageDto } from "../../application/dtos/send-message.dto.js";
import { CreateSessionUseCase } from "../../application/usecases/create-session.usecase.js";
import { DeleteSessionUseCase } from "../../application/usecases/delete-session.usecase.js";
import { GetSessionMessagesUseCase } from "../../application/usecases/get-session-messages.usecase.js";
import { ListSessionsUseCase } from "../../application/usecases/list-sessions.usecase.js";
import { SendMessageUseCase } from "../../application/usecases/send-message.usecase.js";
import type { FileAttachment } from "../../domain/ports/ai-provider.port.js";

type AuthenticatedRequest = Request & {
	user: {
		id: string;
		role: UserRole;
	};
};

@Controller("chat")
@UseGuards(SupabaseAuthGuard)
export class ChatController {
	private readonly logger = new Logger(ChatController.name);

	constructor(
		private readonly createSession: CreateSessionUseCase,
		private readonly listSessions: ListSessionsUseCase,
		private readonly getSessionMessages: GetSessionMessagesUseCase,
		private readonly sendMessage: SendMessageUseCase,
		private readonly deleteSession: DeleteSessionUseCase,
		private readonly prisma: PrismaService,
		private readonly uploadService: UploadService,
	) {}

	@Post("sessions")
	@Throttle(RATE_LIMITS.chatSessionCreate)
	async create(@Body() dto: CreateSessionDto, @Req() req: AuthenticatedRequest) {
		const session = await this.createSession.execute(
			dto.agent_id,
			req.user.id,
			dto.test_mode === true,
			req.user.role,
		);
		return {
			id: session.id,
			agent_id: session.agentId,
			created_at: session.createdAt.toISOString(),
		};
	}

	@Get("sessions")
	async list(
		@Req() req: AuthenticatedRequest,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
	) {
		const parsedLimit = this.parseBoundedInt(limit, 20, 1, 50);
		const parsedOffset = this.parseBoundedInt(offset, 0, 0, 10_000);
		return this.listSessions.execute(req.user.id, parsedLimit, parsedOffset);
	}

	@Get("sessions/:id/messages")
	async messages(
		@Param("id") id: string,
		@Req() req: AuthenticatedRequest,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
	) {
		const parsedLimit = this.parseBoundedInt(limit, 50, 1, 100);
		const parsedOffset = this.parseBoundedInt(offset, 0, 0, 10_000);
		return this.getSessionMessages.execute(id, req.user.id, parsedLimit, parsedOffset);
	}

	@Post("sessions/:id/messages")
	@Throttle(RATE_LIMITS.chatMessage)
	@SkipTransform()
	async sendMsg(
		@Param("id") id: string,
		@Body() dto: SendMessageDto,
		@Req() req: AuthenticatedRequest,
		@Res() res: Response,
	) {
		// Resolve file attachments from DB
		let attachments: FileAttachment[] = [];
		let attachmentIds: string[] = [];
		if (dto.file_ids?.length) {
			attachmentIds = [...new Set(dto.file_ids)];
			const files = await this.prisma.uploadedFile.findMany({
				where: {
					id: { in: attachmentIds },
					userId: req.user.id,
					OR: [{ sessionId: null }, { sessionId: id }],
				},
				select: { id: true, url: true, mimeType: true, type: true },
			});
			if (files.length !== attachmentIds.length) {
				throw new BadRequestException(
					"Un ou plusieurs fichiers sont introuvables ou non autorisés.",
				);
			}
			const signedFiles = await Promise.all(
				files.map(async (file) => ({
					...file,
					url: await this.uploadService.createSignedUrl(file.url),
				})),
			);
			attachments = signedFiles.map((f) => ({
				type: f.type === "DOCUMENT" ? "document" : "image",
				url: f.url,
				mimeType: f.mimeType,
			}));
		}

		const { stream, onComplete } = await this.sendMessage.execute(
			id,
			req.user.id,
			dto.content,
			dto.content_type ?? "TEXT",
			attachments,
			attachmentIds,
			req.user.role,
		);

		// Vercel AI SDK data stream protocol
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.setHeader("x-vercel-ai-data-stream", "v1");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		let fullText = "";

		try {
			for await (const event of stream) {
				if (event.type === "text") {
					fullText += event.delta;
					// 0: text token
					res.write(`0:${JSON.stringify(event.delta)}\n`);
					continue;
				}
				if (event.type === "tool_call" || event.type === "tool_result") {
					// 8: custom Claake tool event
					res.write(`8:${JSON.stringify(event)}\n`);
					continue;
				}
				if (event.type === "done") {
					break;
				}
			}

			await onComplete(fullText);
			// d: finish step
			res.write(`d:${JSON.stringify({ finishReason: "stop" })}\n`);
		} catch (error) {
			this.logger.warn(
				`AI stream failed for session ${id}: ${error instanceof Error ? error.message : "unknown error"}`,
			);
			// 3: error — never expose provider/vendor details to the client
			res.write(`3:${JSON.stringify("La réponse IA est momentanément indisponible.")}\n`);
		} finally {
			res.end();
		}
	}

	@Delete("sessions/:id")
	async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
		await this.deleteSession.execute(id, req.user.id);
		return { deleted: true };
	}

	private parseBoundedInt(
		value: string | undefined,
		fallback: number,
		min: number,
		max: number,
	): number {
		if (value === undefined) return fallback;
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed) || parsed < min) return fallback;
		return Math.min(parsed, max);
	}
}
