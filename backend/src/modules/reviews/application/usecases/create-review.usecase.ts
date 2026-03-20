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
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../../payments/domain/ports/payment.repository.port.js";
import { CHAT_SESSION_REPOSITORY } from "../../../chat/domain/ports/chat-session.repository.port.js";
import type { ChatSessionRepositoryPort } from "../../../chat/domain/ports/chat-session.repository.port.js";
import {
	REVIEW_REPOSITORY,
	type ReviewRepositoryPort,
} from "../../domain/ports/review.repository.port.js";
import type { CreateReviewDto } from "../dtos/create-review.dto.js";
import type { ReviewResponseDto } from "../dtos/review-response.dto.js";
import { ReviewTransformer } from "../transformers/review.transformer.js";

@Injectable()
export class CreateReviewUseCase {
	constructor(
		@Inject(REVIEW_REPOSITORY) private readonly reviewRepo: ReviewRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
		@Inject(CHAT_SESSION_REPOSITORY) private readonly chatRepo: ChatSessionRepositoryPort,
	) {}

	async execute(
		agentId: string,
		dto: CreateReviewDto,
		userId: string,
	): Promise<ReviewResponseDto> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) throw new NotFoundException("Agent not found");

		// Check no existing review
		const existing = await this.reviewRepo.findByUserAndAgent(userId, agentId);
		if (existing) throw new BadRequestException("You already reviewed this agent");

		let verifiedPurchase = false;
		let verifiedInteraction = false;

		if (!agent.isFree()) {
			// Paid agent: check purchase
			verifiedPurchase = await this.paymentRepo.hasAccess(userId, agentId);
			if (!verifiedPurchase) {
				throw new ForbiddenException("You must purchase this agent before reviewing");
			}
		} else {
			// Free agent: check chat interaction
			const sessions = await this.chatRepo.findByUserAndAgent(userId, agentId);
			verifiedInteraction = sessions !== null;
			if (!verifiedInteraction) {
				throw new ForbiddenException("You must use this agent before reviewing");
			}
		}

		const review = await this.reviewRepo.create({
			userId,
			agentId,
			rating: dto.rating,
			comment: dto.comment,
			verifiedPurchase,
			verifiedInteraction,
		});

		// Recalculate agent stats
		const stats = await this.reviewRepo.computeAgentStats(agentId);
		await this.agentRepo.updateRating(agentId, stats.avg, stats.count);

		return ReviewTransformer.toDto(review);
	}
}
