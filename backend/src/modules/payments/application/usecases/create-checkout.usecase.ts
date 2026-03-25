import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../../users/domain/ports/user.repository.port.js";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";
import { STRIPE_SERVICE, type StripeServicePort } from "../../domain/ports/stripe.port.js";
import { calculateCommission } from "../../domain/services/commission-calculator.js";

@Injectable()
export class CreateCheckoutUseCase {
	constructor(
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
		@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
	) {}

	async execute(agentId: string, userId: string): Promise<{ url: string }> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) throw new NotFoundException("Agent not found");
		if (agent.isFree()) throw new BadRequestException("This agent is free");

		const isSubscription = agent.pricingModel === "SUBSCRIPTION";

		// For one-time purchases, check if already purchased
		if (!isSubscription) {
			const existing = await this.paymentRepo.findPurchaseByUserAndAgent(userId, agentId);
			if (existing) throw new BadRequestException("Already purchased");
		}

		// Get creator's Stripe Connect account
		const creator = await this.userRepo.findById(agent.creatorId);
		if (!creator) throw new NotFoundException("Creator not found");

		const priceInCents = Math.round(agent.price * 100);

		// Calculate commission based on total sales for this agent
		const totalSales = await this.paymentRepo.countSalesForAgent(agentId);
		const commission = calculateCommission(priceInCents, totalSales);

		const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

		return this.stripe.createCheckoutSession({
			agentId: agent.id,
			agentName: agent.name,
			priceInCents,
			currency: "eur",
			userId,
			mode: isSubscription ? "subscription" : "payment",
			creatorStripeAccountId: creator.stripeAccountId ?? undefined,
			applicationFeeInCents: commission.platformFee,
			successUrl: `${webUrl}/checkout/success?agent=${agentId}`,
			cancelUrl: `${webUrl}/checkout/cancel?agent=${agentId}`,
		});
	}
}
