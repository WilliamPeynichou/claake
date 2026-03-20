import { Inject, Injectable } from "@nestjs/common";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";
import { ChatSessionTransformer } from "../transformers/chat-session.transformer.js";

@Injectable()
export class ListSessionsUseCase {
	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly repo: ChatSessionRepositoryPort,
	) {}

	async execute(userId: string, limit = 20, offset = 0) {
		const { sessions, total } = await this.repo.findByUser(userId, limit, offset);
		return {
			sessions: sessions.map(ChatSessionTransformer.toDto),
			total,
		};
	}
}
