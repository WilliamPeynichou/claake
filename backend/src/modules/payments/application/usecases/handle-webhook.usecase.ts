import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	AGENT_REPOSITORY,
	type AgentRepositoryPort,
} from "../../../agents/domain/ports/agent.repository.port.js";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";
import { STRIPE_SERVICE, type StripeServicePort } from "../../domain/ports/stripe.port.js";
import { calculateCommission } from "../../domain/services/commission-calculator.js";

@Injectable()
export class HandleWebhookUseCase {
	private readonly logger = new Logger(HandleWebhookUseCase.name);

	constructor(
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
		const event = await this.stripe.constructWebhookEvent(rawBody, signature);

		switch (event.type) {
			case "checkout.session.completed":
				await this.handleCheckoutCompleted(event.data);
				break;
			case "invoice.paid":
				await this.handleInvoicePaid(event.data);
				break;
			case "customer.subscription.updated":
				await this.handleSubscriptionUpdated(event.data);
				break;
			case "customer.subscription.deleted":
				await this.handleSubscriptionDeleted(event.data);
				break;
		}

		return { received: true };
	}

	private async handleCheckoutCompleted(session: Record<string, any>): Promise<void> {
		const metadata = session.metadata ?? {};
		const userId = metadata.user_id;
		const agentId = metadata.agent_id;
		if (!userId || !agentId) return;

		const mode = session.mode;

		if (mode === "subscription") {
			const stripeSubId = session.subscription;
			if (stripeSubId) {
				await this.paymentRepo.createSubscription({
					userId,
					agentId,
					stripeSubId,
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				});
				this.logger.log(`Subscription created for user=${userId} agent=${agentId}`);
			}
		} else {
			const existing = await this.paymentRepo.findPurchaseByUserAndAgent(userId, agentId);
			if (!existing) {
				await this.paymentRepo.createPurchase({
					userId,
					agentId,
					amount: (session.amount_total ?? 0) / 100,
					currency: session.currency ?? "eur",
					stripePaymentId: session.payment_intent ?? session.id,
				});
				this.logger.log(`Purchase created for user=${userId} agent=${agentId}`);
			}
		}

		await this.logCommission(agentId, userId, session);
	}

	private async handleInvoicePaid(invoice: Record<string, any>): Promise<void> {
		const subMetadata = invoice.subscription_details?.metadata ?? {};
		const userId = subMetadata.user_id;
		const agentId = subMetadata.agent_id;
		if (!userId || !agentId) return;

		await this.logCommission(agentId, userId, {
			amount_total: invoice.amount_paid,
			currency: invoice.currency,
			payment_intent: invoice.payment_intent,
		});

		this.logger.log(`Invoice paid for subscription user=${userId} agent=${agentId}`);
	}

	private async handleSubscriptionUpdated(sub: Record<string, any>): Promise<void> {
		const stripeSubId = sub.id;
		if (!stripeSubId) return;

		const status = sub.status === "active" ? "ACTIVE" : "PAST_DUE";
		const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined;

		await this.paymentRepo.updateSubscriptionStatus(
			stripeSubId,
			status as "ACTIVE" | "PAST_DUE",
			periodEnd,
		);
		this.logger.log(`Subscription ${stripeSubId} updated to ${status}`);
	}

	private async handleSubscriptionDeleted(sub: Record<string, any>): Promise<void> {
		const stripeSubId = sub.id;
		if (!stripeSubId) return;

		await this.paymentRepo.updateSubscriptionStatus(stripeSubId, "CANCELLED");
		this.logger.log(`Subscription ${stripeSubId} cancelled`);
	}

	private async logCommission(
		agentId: string,
		buyerId: string,
		session: Record<string, any>,
	): Promise<void> {
		const agent = await this.agentRepo.findById(agentId);
		if (!agent) return;

		const amountInCents = session.amount_total ?? 0;
		if (amountInCents === 0) return;

		const totalSales = await this.paymentRepo.countSalesForAgent(agentId);
		const commission = calculateCommission(amountInCents, totalSales);

		await this.paymentRepo.createCommission({
			agentId,
			creatorId: agent.creatorId,
			buyerId,
			amount: amountInCents / 100,
			platformFee: commission.platformFee / 100,
			creatorPayout: commission.creatorPayout / 100,
			commissionRate: commission.commissionRate,
			currency: session.currency ?? "eur",
			stripePaymentId: session.payment_intent ?? undefined,
			saleNumber: totalSales + 1,
		});
	}
}
