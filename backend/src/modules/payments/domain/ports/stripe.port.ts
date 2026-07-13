export const STRIPE_SERVICE = Symbol("STRIPE_SERVICE");

export interface StripeWebhookEventData {
	id: string;
	type: string;
	data: StripeCheckoutSessionData;
}

/** Minimal shape of a Stripe checkout session payload we consume. */
export interface StripeCheckoutSessionData {
	id?: string;
	payment_status?: string;
	metadata?: Record<string, unknown> | null;
	payment_intent?: string | { id?: unknown } | null;
	amount_total?: number | null;
	currency?: string | null;
}

export interface StripeServicePort {
	createCheckoutSession(params: {
		agentId: string;
		agentName: string;
		priceInCents: number;
		currency: string;
		userId: string;
		creatorStripeAccountId?: string;
		successUrl: string;
		cancelUrl: string;
	}): Promise<{ url: string }>;
	constructWebhookEvent(rawBody: Buffer, signature: string): Promise<StripeWebhookEventData>;
	createConnectAccount(email: string): Promise<{ accountId: string }>;
	createAccountLink(accountId: string, returnUrl: string): Promise<{ url: string }>;
	getAccountStatus(accountId: string): Promise<{ details_submitted: boolean }>;
}
