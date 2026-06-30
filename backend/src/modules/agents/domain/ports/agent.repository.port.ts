import type { AgentEntity } from "../entities/agent.entity.js";

export const AGENT_REPOSITORY = Symbol("AGENT_REPOSITORY");

export interface AgentListParams {
	q?: string;
	category?: string;
	publishedOnly?: boolean;
	creatorId?: string;
	pricingModel?: string;
	mode?: string;
	minRating?: number;
	tags?: string[];
	sortBy?: string;
	page?: number;
	limit?: number;
}

export interface AgentRepositoryPort {
	findAll(params: AgentListParams): Promise<{ agents: AgentEntity[]; total: number }>;
	findById(id: string): Promise<AgentEntity | null>;
	findBySlug(slug: string): Promise<AgentEntity | null>;
	create(data: Partial<AgentEntity>): Promise<AgentEntity>;
	update(id: string, data: Partial<AgentEntity>): Promise<AgentEntity>;
	updateStatus(id: string, status: string, scanStatus?: string): Promise<void>;
	updateRating(id: string, rating: number, reviewCount: number): Promise<void>;
	softDelete(id: string): Promise<void>;
	hasPurchased(userId: string, agentId: string): Promise<boolean>;
	hasActiveSubscription(userId: string, agentId: string): Promise<boolean>;
}
