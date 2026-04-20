import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";
import { ChatMessageTransformer } from "../transformers/chat-message.transformer.js";

@Injectable()
export class GetSessionMessagesUseCase {
	constructor(@Inject(CHAT_SESSION_REPOSITORY) private readonly repo: ChatSessionRepositoryPort) {}

	async execute(sessionId: string, userId: string, limit = 50, offset = 0) {
		const session = await this.repo.findById(sessionId);
		if (!session) {
			throw new NotFoundException("Session not found");
		}
		if (!session.isOwnedBy(userId)) {
			throw new ForbiddenException("Access denied");
		}

		const { messages, total } = await this.repo.getMessages(sessionId, limit, offset);
		return {
			messages: messages.map(ChatMessageTransformer.toDto),
			total,
		};
	}
}
