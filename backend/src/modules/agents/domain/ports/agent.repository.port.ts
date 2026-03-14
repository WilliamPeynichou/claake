import type { AgentEntity } from "../entities/agent.entity.js";

export const AGENT_REPOSITORY = Symbol("AGENT_REPOSITORY");

export interface AgentListParams {
	q?: string;
	category?: string;
	publishedOnly?: boolean;
}

export interface AgentRepositoryPort {
	findAll(params: AgentListParams): Promise<{ agents: AgentEntity[]; total: number }>;
	findById(id: string): Promise<AgentEntity | null>;
	findBySlug(slug: string): Promise<AgentEntity | null>;
	create(data: Partial<AgentEntity>): Promise<AgentEntity>;
}
