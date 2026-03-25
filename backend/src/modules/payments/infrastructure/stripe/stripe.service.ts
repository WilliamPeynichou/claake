import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { CheckoutParams, StripeServicePort } from "../../domain/ports/stripe.port.js";

@Injectable()
export class StripeService implements StripeServicePort {
	private readonly stripe: Stripe;
	private readonly webhookSecret: string;

	constructor(private readonly config: ConfigService) {
		this.stripe = new Stripe(this.config.getOrThrow<string>("STRIPE_SECRET_KEY"), {
			apiVersion: "2025-04-30.basil" as any,
		});
		this.webhookSecret = this.config.getOrThrow<string>("STRIPE_WEBHOOK_SECRET");
	}

	async createCheckoutSession(params: CheckoutParams): Promise<{ url: string }> {
		const isSubscription = params.mode === "subscription";

		const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
			currency: params.currency,
			product_data: { name: params.agentName },
			unit_amount: params.priceInCents,
			...(isSubscription && { recurring: { interval: "month" as const } }),
		};

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: isSubscription ? "subscription" : "payment",
			line_items: [{ price_data: priceData, quantity: 1 }],
			metadata: {
				user_id: params.userId,
				agent_id: params.agentId,
			},
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
		};

		// Destination charge: money goes to Claake, creator gets transfer minus fee
		if (params.creatorStripeAccountId) {
			if (isSubscription) {
				sessionParams.subscription_data = {
					application_fee_percent: params.applicationFeeInCents
						? (params.applicationFeeInCents / params.priceInCents) * 100
						: undefined,
					transfer_data: { destination: params.creatorStripeAccountId },
					metadata: {
						user_id: params.userId,
						agent_id: params.agentId,
					},
				};
			} else {
				sessionParams.payment_intent_data = {
					application_fee_amount: params.applicationFeeInCents,
					transfer_data: { destination: params.creatorStripeAccountId },
				};
			}
		}

		const session = await this.stripe.checkout.sessions.create(sessionParams);
		return { url: session.url! };
	}

	async constructWebhookEvent(
		rawBody: Buffer,
		signature: string,
	): Promise<{ type: string; data: Record<string, any> }> {
		try {
			const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
			return { type: event.type, data: event.data.object as Record<string, any> };
		} catch {
			throw new BadRequestException("Invalid webhook signature");
		}
	}

	async createConnectAccount(email: string): Promise<{ accountId: string }> {
		const account = await this.stripe.accounts.create({
			type: "express",
			email,
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true },
			},
		});
		return { accountId: account.id };
	}

	async createAccountLink(accountId: string, returnUrl: string): Promise<{ url: string }> {
		const link = await this.stripe.accountLinks.create({
			account: accountId,
			refresh_url: returnUrl,
			return_url: returnUrl,
			type: "account_onboarding",
		});
		return { url: link.url };
	}

	async getAccountStatus(
		accountId: string,
	): Promise<{ details_submitted: boolean; payouts_enabled: boolean }> {
		const account = await this.stripe.accounts.retrieve(accountId);
		return {
			details_submitted: account.details_submitted ?? false,
			payouts_enabled: account.payouts_enabled ?? false,
		};
	}
}
