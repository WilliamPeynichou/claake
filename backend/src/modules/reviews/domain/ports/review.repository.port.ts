import type { ReviewEntity } from "../entities/review.entity.js";

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");

export interface ReviewRepositoryPort {
	create(data: {
		userId: string;
		agentId: string;
		rating: number;
		comment?: string;
		verifiedPurchase: boolean;
		verifiedInteraction: boolean;
	}): Promise<ReviewEntity>;
	findById(id: string): Promise<ReviewEntity | null>;
	findByUserAndAgent(userId: string, agentId: string): Promise<ReviewEntity | null>;
	findByAgentId(
		agentId: string,
		page: number,
		limit: number,
	): Promise<{ reviews: ReviewEntity[]; total: number }>;
	update(id: string, data: { rating?: number; comment?: string }): Promise<ReviewEntity>;
	delete(id: string): Promise<void>;
	computeAgentStats(agentId: string): Promise<{ avg: number; count: number }>;
}
