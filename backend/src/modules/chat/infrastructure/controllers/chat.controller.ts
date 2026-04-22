import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
} from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { SkipTransform } from "../../../../common/decorators/skip-transform.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { PrismaService } from "../../../../prisma/prisma.service.js";
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
	constructor(
		private readonly createSession: CreateSessionUseCase,
		private readonly listSessions: ListSessionsUseCase,
		private readonly getSessionMessages: GetSessionMessagesUseCase,
		private readonly sendMessage: SendMessageUseCase,
		private readonly deleteSession: DeleteSessionUseCase,
		private readonly prisma: PrismaService,
	) {}

	@Post("sessions")
	async create(@Body() dto: CreateSessionDto, @Req() req: AuthenticatedRequest) {
		const session = await this.createSession.execute(dto.agent_id, req.user.id);
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
		return this.listSessions.execute(
			req.user.id,
			limit ? Number.parseInt(limit, 10) : 20,
			offset ? Number.parseInt(offset, 10) : 0,
		);
	}

	@Get("sessions/:id/messages")
	async messages(
		@Param("id") id: string,
		@Req() req: AuthenticatedRequest,
		@Query("limit") limit?: string,
		@Query("offset") offset?: string,
	) {
		return this.getSessionMessages.execute(
			id,
			req.user.id,
			limit ? Number.parseInt(limit, 10) : 50,
			offset ? Number.parseInt(offset, 10) : 0,
		);
	}

	@Post("sessions/:id/messages")
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
			attachments = files.map((f) => ({
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
		);

		// Vercel AI SDK data stream protocol
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.setHeader("x-vercel-ai-data-stream", "v1");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		let fullText = "";

		try {
			for await (const chunk of stream) {
				fullText += chunk;
				// 0: text token
				res.write(`0:${JSON.stringify(chunk)}\n`);
			}

			await onComplete(fullText);
			// d: finish step
			res.write(`d:${JSON.stringify({ finishReason: "stop" })}\n`);
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "Stream error";
			// 3: error
			res.write(`3:${JSON.stringify(errMsg)}\n`);
		} finally {
			res.end();
		}
	}

	@Delete("sessions/:id")
	async remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
		await this.deleteSession.execute(id, req.user.id);
		return { deleted: true };
	}
}
