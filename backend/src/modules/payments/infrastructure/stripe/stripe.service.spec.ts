import { ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StripeService } from "./stripe.service";

describe("StripeService configuration", () => {
	it("allows application startup without Stripe in development", () => {
		expect(() => new StripeService(new ConfigService({}))).not.toThrow();
	});

	it("fails payment operations explicitly when Stripe is not configured", async () => {
		const service = new StripeService(new ConfigService({}));

		await expect(
			service.createCheckoutSession({
				agentId: "agent-1",
				agentName: "Agent",
				priceInCents: 1000,
				currency: "eur",
				userId: "user-1",
				successUrl: "https://example.com/success",
				cancelUrl: "https://example.com/cancel",
			}),
		).rejects.toBeInstanceOf(ServiceUnavailableException);
	});

	it("fails webhook verification explicitly without Stripe configuration", async () => {
		const service = new StripeService(new ConfigService({}));
		await expect(
			service.constructWebhookEvent(Buffer.from("{}"), "signature"),
		).rejects.toBeInstanceOf(ServiceUnavailableException);
	});
});
