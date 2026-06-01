import { BadRequestException } from "@nestjs/common";
import { AgentEntity } from "../../../agents/domain/entities/agent.entity";
import { HandleWebhookUseCase } from "./handle-webhook.usecase";

type StripeEvent = {
	id: string;
	type: string;
	data: Record<string, any>;
};

function createAgent(
	overrides: Partial<Pick<AgentEntity, "status" | "pricingModel" | "price">> = {},
) {
	return new AgentEntity(
		"agent-1",
		"Paid Agent",
		"paid-agent",
		"description",
		null,
		"productivity",
		[],
		["gpt-4o"],
		"CLOUD",
		null,
		null,
		[],
		overrides.pricingModel ?? "ONE_TIME",
		overrides.price ?? 12,
		1,
		overrides.status ?? "APPROVED",
		null,
		0,
		0,
		0,
		"creator-1",
		"Creator",
		new Date("2025-01-01T00:00:00Z"),
		new Date("2025-01-01T00:00:00Z"),
	);
}

function createSubject(event: StripeEvent, existingPurchase: unknown = null) {
	const stripe = {
		constructWebhookEvent: jest.fn().mockResolvedValue(event),
	};
	const paymentRepo = {
		findPurchaseByUserAndAgent: jest.fn().mockResolvedValue(existingPurchase),
		findPurchaseByStripePaymentId: jest.fn().mockResolvedValue(null),
		createPurchase: jest.fn().mockResolvedValue({ id: "purchase-1" }),
		findPurchasesByUser: jest.fn(),
		hasAccess: jest.fn(),
		hasProcessedStripeEvent: jest.fn().mockResolvedValue(false),
		recordStripeEvent: jest.fn().mockResolvedValue(undefined),
	};
	const agentRepo = {
		findById: jest.fn().mockResolvedValue(createAgent()),
	};
	return {
		stripe,
		paymentRepo,
		agentRepo,
		useCase: new HandleWebhookUseCase(stripe as any, paymentRepo as any, agentRepo as any),
	};
}

function checkoutCompleted(overrides: Record<string, any> = {}): StripeEvent {
	return {
		id: "evt_test_1",
		type: "checkout.session.completed",
		data: {
			id: "cs_test_1",
			payment_intent: "pi_test_1",
			payment_status: "paid",
			amount_total: 1200,
			currency: "eur",
			metadata: {
				user_id: "user-1",
				agent_id: "agent-1",
			},
			...overrides,
		},
	};
}

describe("HandleWebhookUseCase — Stripe webhook hardening", () => {
	it("crée un achat uniquement pour une checkout session payée et cohérente avec l'agent publié", async () => {
		const { useCase, paymentRepo } = createSubject(checkoutCompleted());

		await expect(useCase.execute(Buffer.from("{}"), "valid-signature")).resolves.toEqual({
			received: true,
		});

		expect(paymentRepo.recordStripeEvent).toHaveBeenCalledWith(
			"evt_test_1",
			"checkout.session.completed",
		);
		expect(paymentRepo.createPurchase).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				agentId: "agent-1",
				amount: 12,
				currency: "eur",
				stripePaymentId: "pi_test_1",
			}),
		);
	});

	it("ignore une session checkout complétée dont le paiement n'est pas payé", async () => {
		const { useCase, paymentRepo } = createSubject(checkoutCompleted({ payment_status: "unpaid" }));

		await useCase.execute(Buffer.from("{}"), "valid-signature");

		expect(paymentRepo.createPurchase).not.toHaveBeenCalled();
	});

	it("rejette une session dont le montant reçu ne correspond pas au prix serveur", async () => {
		const { useCase, paymentRepo } = createSubject(checkoutCompleted({ amount_total: 100 }));

		await expect(useCase.execute(Buffer.from("{}"), "valid-signature")).rejects.toBeInstanceOf(
			BadRequestException,
		);

		expect(paymentRepo.createPurchase).not.toHaveBeenCalled();
	});

	it("rejette une session dont la devise reçue n'est pas la devise serveur attendue", async () => {
		const { useCase, paymentRepo } = createSubject(checkoutCompleted({ currency: "usd" }));

		await expect(useCase.execute(Buffer.from("{}"), "valid-signature")).rejects.toBeInstanceOf(
			BadRequestException,
		);

		expect(paymentRepo.createPurchase).not.toHaveBeenCalled();
	});

	it("ignore un webhook déjà traité pour garantir l'idempotence par event.id", async () => {
		const { useCase, paymentRepo } = createSubject({ id: "evt_replayed", ...checkoutCompleted() });
		paymentRepo.hasProcessedStripeEvent.mockResolvedValue(true);

		await useCase.execute(Buffer.from("{}"), "valid-signature");

		expect(paymentRepo.recordStripeEvent).not.toHaveBeenCalled();
		expect(paymentRepo.createPurchase).not.toHaveBeenCalled();
	});

	it("rejette un achat si l'agent n'est plus publié au moment du webhook", async () => {
		const { useCase, paymentRepo, agentRepo } = createSubject(checkoutCompleted());
		agentRepo.findById.mockResolvedValue(createAgent({ status: "DRAFT" }));

		await expect(useCase.execute(Buffer.from("{}"), "valid-signature")).rejects.toBeInstanceOf(
			BadRequestException,
		);

		expect(paymentRepo.createPurchase).not.toHaveBeenCalled();
	});
});
