import { Inject, Injectable, Logger } from "@nestjs/common";
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
	) {}

	async execute(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
		const event = await this.stripe.constructWebhookEvent(rawBody, signature);

		if (event.type === "checkout.session.completed") {
			const session = event.data;
			const metadata = session.metadata ?? {};
			const userId = metadata.user_id;
			const agentId = metadata.agent_id;

			if (userId && agentId) {
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
		}

		return { received: true };
	}
}
