import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
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
export class HandleWebhookUseCase {
	private readonly logger = new Logger(HandleWebhookUseCase.name);

	constructor(
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort,
		@Inject(AGENT_REPOSITORY) private readonly agentRepo: AgentRepositoryPort,
	) {}

	async execute(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
		const event = await this.stripe.constructWebhookEvent(rawBody, signature);

		if (await this.paymentRepo.hasProcessedStripeEvent(event.id)) {
			this.logger.warn(`Ignoring replayed Stripe event id=${event.id}`);
			return { received: true };
		}

		if (event.type === "checkout.session.completed") {
			await this.handleCheckoutSessionCompleted(event.data);
		}

		await this.paymentRepo.recordStripeEvent(event.id, event.type);

		return { received: true };
	}

	private async handleCheckoutSessionCompleted(session: Record<string, any>): Promise<void> {
		if (session.payment_status !== "paid") {
			this.logger.warn(`Ignoring unpaid checkout session id=${session.id}`);
			return;
		}

		const metadata = session.metadata ?? {};
		const userId = typeof metadata.user_id === "string" ? metadata.user_id : null;
		const agentId = typeof metadata.agent_id === "string" ? metadata.agent_id : null;
		if (!userId || !agentId) {
			throw new BadRequestException("Invalid checkout session metadata");
		}

		const agent = await this.agentRepo.findById(agentId);
		if (!agent) {
			throw new NotFoundException("Agent not found");
		}
		if (!agent.isPublished() || agent.isFree()) {
			throw new BadRequestException("Agent is not purchasable");
		}

		const expectedAmount = Math.round(agent.price * 100);
		if (session.amount_total !== expectedAmount || session.currency !== "eur") {
			this.logger.warn(
				`Checkout amount/currency mismatch for session=${session.id} agent=${agentId}`,
			);
			throw new BadRequestException("Checkout session mismatch");
		}

		const stripePaymentId = this.extractStripePaymentId(session);
		if (!stripePaymentId) {
			throw new BadRequestException("Missing Stripe payment identifier");
		}

		const existingByPayment = await this.paymentRepo.findPurchaseByStripePaymentId(stripePaymentId);
		if (existingByPayment) {
			if (existingByPayment.userId !== userId || existingByPayment.agentId !== agentId) {
				throw new BadRequestException("Stripe payment identifier already used");
			}
			return;
		}

		const existing = await this.paymentRepo.findPurchaseByUserAndAgent(userId, agentId);
		if (!existing) {
			await this.paymentRepo.createPurchase({
				userId,
				agentId,
				amount: expectedAmount / 100,
				currency: "eur",
				stripePaymentId,
			});
			this.logger.log(`Purchase created for user=${userId} agent=${agentId}`);
		}
	}

	private extractStripePaymentId(session: Record<string, any>): string | null {
		if (typeof session.payment_intent === "string") return session.payment_intent;
		if (session.payment_intent && typeof session.payment_intent.id === "string") {
			return session.payment_intent.id;
		}
		return typeof session.id === "string" ? session.id : null;
	}
}
