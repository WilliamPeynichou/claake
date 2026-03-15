import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";

@Injectable()
export class DeleteSessionUseCase {
	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly repo: ChatSessionRepositoryPort,
	) {}

	async execute(sessionId: string, userId: string): Promise<void> {
		const session = await this.repo.findById(sessionId);
		if (!session) {
			throw new NotFoundException("Session not found");
		}
		if (!session.isOwnedBy(userId)) {
			throw new ForbiddenException("Access denied");
		}

		await this.repo.delete(sessionId);
	}
}
