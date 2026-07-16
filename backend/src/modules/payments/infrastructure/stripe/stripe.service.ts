import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type {
	StripeCheckoutSessionData,
	StripeServicePort,
} from "../../domain/ports/stripe.port.js";

@Injectable()
export class StripeService implements StripeServicePort {
	private readonly stripe: Stripe | null;
	private readonly webhookSecret: string | null;

	constructor(private readonly config: ConfigService) {
		const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
		this.webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET") || null;
		this.stripe = secretKey
			? new Stripe(secretKey, {
					apiVersion: "2025-04-30.basil" as Stripe.StripeConfig["apiVersion"],
				})
			: null;
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

		const session = await this.requireStripe().checkout.sessions.create(sessionParams);
		if (!session.url) {
			throw new BadRequestException("Stripe checkout session has no URL");
		}
		return { url: session.url };
	}

	async constructWebhookEvent(
		rawBody: Buffer,
		signature: string,
	): Promise<{ id: string; type: string; data: StripeCheckoutSessionData }> {
		const stripe = this.requireStripe();
		if (!this.webhookSecret) {
			throw new ServiceUnavailableException("Stripe webhook is not configured");
		}
		try {
			const event = stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
			return {
				id: event.id,
				type: event.type,
				data: event.data.object as StripeCheckoutSessionData,
			};
		} catch {
			throw new BadRequestException("Invalid webhook signature");
		}
	}

	async createConnectAccount(email: string): Promise<{ accountId: string }> {
		const account = await this.requireStripe().accounts.create({
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
		const link = await this.requireStripe().accountLinks.create({
			account: accountId,
			refresh_url: returnUrl,
			return_url: returnUrl,
			type: "account_onboarding",
		});
		return { url: link.url };
	}

	async getAccountStatus(accountId: string): Promise<{ details_submitted: boolean }> {
		const account = await this.requireStripe().accounts.retrieve(accountId);
		return { details_submitted: account.details_submitted ?? false };
	}

	private requireStripe(): Stripe {
		if (!this.stripe) {
			throw new ServiceUnavailableException("Stripe is not configured");
		}
		return this.stripe;
	}
}
