import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	CHAT_SESSION_REPOSITORY,
	type ChatSessionRepositoryPort,
} from "../../domain/ports/chat-session.repository.port.js";

@Injectable()
export class CreateSessionUseCase {
	constructor(
		@Inject(CHAT_SESSION_REPOSITORY) private readonly chatRepo: ChatSessionRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(agentId: string, userId: string) {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		return this.chatRepo.create(userId, agentId);
	}
}
