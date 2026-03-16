import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";
import { STRIPE_SERVICE, type StripeServicePort } from "../../domain/ports/stripe.port.js";

@Injectable()
export class CreateCheckoutUseCase {
	constructor(
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
	) {}

	async execute(agentId: string, userId: string): Promise<{ url: string }> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) throw new NotFoundException("Agent not found");
		if (agent.isFree()) throw new BadRequestException("This agent is free");

		// Check if already purchased
		const existing = await this.paymentRepo.findPurchaseByUserAndAgent(userId, agentId);
		if (existing) throw new BadRequestException("Already purchased");

		const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

		return this.stripe.createCheckoutSession({
			agentId: agent.id,
			agentName: agent.name,
			priceInCents: Math.round(agent.price * 100),
			currency: "eur",
			userId,
			successUrl: `${webUrl}/checkout/success?agent=${agentId}`,
			cancelUrl: `${webUrl}/checkout/cancel?agent=${agentId}`,
		});
	}
}
