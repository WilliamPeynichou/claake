import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
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

	async execute(agentId: string, userId: string, testMode = false, actorRole?: string) {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		const canTest =
			testMode &&
			((agent.isOwnedBy(userId) && (agent.status === "DRAFT" || agent.status === "REJECTED")) ||
				((actorRole === "ADMIN" || actorRole === "SUPER_ADMIN") && agent.status === "PENDING"));

		if (agent.status !== "APPROVED" && !canTest) {
			throw new BadRequestException("This agent is not available");
		}

		if (!agent.isFree() && !agent.isOwnedBy(userId)) {
			const [purchased, subscribed] = await Promise.all([
				this.agentRepo.hasPurchased(userId, agentId),
				this.agentRepo.hasActiveSubscription(userId, agentId),
			]);
			if (!purchased && !subscribed) {
				throw new ForbiddenException("Purchase required to use this agent");
			}
		}

		return this.chatRepo.create(userId, agentId);
	}
}
