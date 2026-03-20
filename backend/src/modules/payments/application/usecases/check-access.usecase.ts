import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";

@Injectable()
export class CheckAccessUseCase {
	constructor(
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
	) {}

	async execute(agentId: string, userId: string): Promise<{ has_access: boolean }> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) throw new NotFoundException("Agent not found");

		// Free agents always accessible
		if (agent.isFree()) return { has_access: true };

		// Creator always has access to their own agent
		if (agent.isOwnedBy(userId)) return { has_access: true };

		const has_access = await this.paymentRepo.hasAccess(userId, agentId);
		return { has_access };
	}
}
