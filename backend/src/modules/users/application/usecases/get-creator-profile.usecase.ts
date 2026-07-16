import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AgentTransformer } from "../../../agents/application/transformers/agent.transformer.js";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";

@Injectable()
export class GetCreatorProfileUseCase {
	constructor(
		@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(creatorId: string) {
		const user = await this.userRepo.findById(creatorId);
		if (!user) throw new NotFoundException("Creator not found");

		const { agents } = await this.agentRepo.findAll({
			creatorId,
			publishedOnly: true,
		});

		const totalReviews = agents.reduce((sum, a) => sum + a.reviewCount, 0);
		const avgRating =
			agents.length > 0
				? agents.reduce((sum, a) => sum + a.rating * a.reviewCount, 0) / (totalReviews || 1)
				: 0;

		const portfolioLinks = user.portfolioLinks ?? [];

		return {
			id: user.id,
			display_name: user.displayName,
			avatar_url: user.avatarUrl,
			bio: user.bio,
			portfolio_links: Array.isArray(portfolioLinks) ? portfolioLinks : [],
			published_agents: agents.map(AgentTransformer.toDto),
			stats: {
				total_agents: agents.length,
				total_reviews: totalReviews,
				average_rating: Math.round(avgRating * 100) / 100,
			},
		};
	}
}
