export const STRIPE_SERVICE = Symbol("STRIPE_SERVICE");

export interface CheckoutParams {
	agentId: string;
	agentName: string;
	priceInCents: number;
	currency: string;
	userId: string;
	mode: "payment" | "subscription";
	creatorStripeAccountId?: string;
	applicationFeeInCents?: number;
	successUrl: string;
	cancelUrl: string;
}

export interface StripeServicePort {
	createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
	constructWebhookEvent(
		rawBody: Buffer,
		signature: string,
	): Promise<{ type: string; data: Record<string, any> }>;
	createConnectAccount(email: string): Promise<{ accountId: string }>;
	createAccountLink(accountId: string, returnUrl: string): Promise<{ url: string }>;
	getAccountStatus(
		accountId: string,
	): Promise<{ details_submitted: boolean; payouts_enabled: boolean }>;
}
