import {
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
import type { Response } from "express";
import { SkipTransform } from "../../../../common/decorators/skip-transform.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CreateSessionDto } from "../../application/dtos/create-session.dto.js";
import type { SendMessageDto } from "../../application/dtos/send-message.dto.js";
import { ChatMessageTransformer } from "../../application/transformers/chat-message.transformer.js";
import { ChatSessionTransformer } from "../../application/transformers/chat-session.transformer.js";
import { CreateSessionUseCase } from "../../application/usecases/create-session.usecase.js";
import { DeleteSessionUseCase } from "../../application/usecases/delete-session.usecase.js";
import { GetSessionMessagesUseCase } from "../../application/usecases/get-session-messages.usecase.js";
import { ListSessionsUseCase } from "../../application/usecases/list-sessions.usecase.js";
import { SendMessageUseCase } from "../../application/usecases/send-message.usecase.js";

@Controller("chat")
@UseGuards(SupabaseAuthGuard)
export class ChatController {
	constructor(
		private readonly createSession: CreateSessionUseCase,
		private readonly listSessions: ListSessionsUseCase,
		private readonly getSessionMessages: GetSessionMessagesUseCase,
		private readonly sendMessage: SendMessageUseCase,
		private readonly deleteSession: DeleteSessionUseCase,
	) {}

	@Post("sessions")
	async create(@Body() dto: CreateSessionDto, @Req() req: any) {
		const session = await this.createSession.execute(dto.agent_id, req.user.id);
		return { id: session.id, agent_id: session.agentId, created_at: session.createdAt.toISOString() };
	}

	@Get("sessions")
	async list(
		@Req() req: any,
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
		@Req() req: any,
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
		@Req() req: any,
		@Res() res: Response,
	) {
		const { stream, onComplete } = await this.sendMessage.execute(
			id,
			req.user.id,
			dto.content,
			dto.content_type ?? "TEXT",
		);

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		let fullText = "";

		try {
			for await (const chunk of stream) {
				fullText += chunk;
				res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
			}

			const savedMessage = await onComplete(fullText);
			const messageDto = ChatMessageTransformer.toDto(savedMessage);
			res.write(`data: ${JSON.stringify({ done: true, message: messageDto })}\n\n`);
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : "Stream error";
			res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
		} finally {
			res.end();
		}
	}

	@Delete("sessions/:id")
	async remove(@Param("id") id: string, @Req() req: any) {
		await this.deleteSession.execute(id, req.user.id);
		return { deleted: true };
	}
}
