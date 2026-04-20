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
} from "../../domain/ports/agent.repository.port.js";

export interface AgentDownloadInfo {
	docker_image: string | null;
	download_url: string | null;
	models: string[];
	system_prompt: string | null;
}

@Injectable()
export class GetAgentDownloadInfoUseCase {
	constructor(@Inject(AGENT_REPOSITORY) private readonly repo: AgentRepositoryPort) {}

	async execute(agentId: string, userId: string): Promise<AgentDownloadInfo> {
		const agent = await this.repo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}

		if (!agent.isLocalCapable()) {
			throw new BadRequestException("This agent does not support local execution");
		}

		const isOwner = agent.isOwnedBy(userId);

		if (!agent.isFree() && !isOwner) {
			const [purchased, subscribed] = await Promise.all([
				this.repo.hasPurchased(userId, agentId),
				this.repo.hasActiveSubscription(userId, agentId),
			]);
			if (!purchased && !subscribed) {
				throw new ForbiddenException("Purchase required to access this agent");
			}
		}

		return {
			docker_image: agent.dockerImage,
			download_url: agent.downloadUrl,
			models: agent.models,
			system_prompt: isOwner ? agent.systemPrompt : null,
		};
	}
}
