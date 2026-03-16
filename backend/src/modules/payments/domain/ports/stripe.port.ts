export const STRIPE_SERVICE = Symbol("STRIPE_SERVICE");

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
	constructWebhookEvent(
		rawBody: Buffer,
		signature: string,
	): Promise<{ type: string; data: Record<string, any> }>;
	createConnectAccount(email: string): Promise<{ accountId: string }>;
	createAccountLink(accountId: string, returnUrl: string): Promise<{ url: string }>;
	getAccountStatus(accountId: string): Promise<{ details_submitted: boolean }>;
}
