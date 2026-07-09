import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { StripeServicePort } from "../../domain/ports/stripe.port.js";

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

	async createCheckoutSession(params: {
		agentId: string;
		agentName: string;
		priceInCents: number;
		currency: string;
		userId: string;
		creatorStripeAccountId?: string;
		successUrl: string;
		cancelUrl: string;
	}): Promise<{ url: string }> {
		const platformFeePercent = Number(
			this.config.get<string>("STRIPE_PLATFORM_FEE_PERCENT") ?? "10",
		);
		const applicationFeeAmount = Math.max(
			0,
			Math.round(params.priceInCents * (platformFeePercent / 100)),
		);

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: "payment",
			line_items: [
				{
					price_data: {
						currency: params.currency,
						product_data: { name: params.agentName },
						unit_amount: params.priceInCents,
					},
					quantity: 1,
				},
			],
			metadata: {
				user_id: params.userId,
				agent_id: params.agentId,
			},
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			payment_intent_data: params.creatorStripeAccountId
				? {
						application_fee_amount: applicationFeeAmount,
						transfer_data: { destination: params.creatorStripeAccountId },
					}
				: undefined,
		};

		const session = await this.stripe.checkout.sessions.create(sessionParams);
		return { url: session.url! };
	}

	async constructWebhookEvent(
		rawBody: Buffer,
		signature: string,
	): Promise<{ id: string; type: string; data: Record<string, any> }> {
		try {
			const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
			return { id: event.id, type: event.type, data: event.data.object as Record<string, any> };
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

	async getAccountStatus(accountId: string): Promise<{ details_submitted: boolean }> {
		const account = await this.stripe.accounts.retrieve(accountId);
		return { details_submitted: account.details_submitted ?? false };
	}
}
