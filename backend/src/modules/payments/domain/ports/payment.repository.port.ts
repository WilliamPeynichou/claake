import type { PurchaseEntity } from "../entities/purchase.entity.js";

export const PAYMENT_REPOSITORY = Symbol("PAYMENT_REPOSITORY");

export interface PaymentRepositoryPort {
	createPurchase(data: {
		userId: string;
		agentId: string;
		amount: number;
		currency: string;
		stripePaymentId?: string;
	}): Promise<PurchaseEntity>;
	findPurchaseByUserAndAgent(userId: string, agentId: string): Promise<PurchaseEntity | null>;
	findPurchaseByStripePaymentId(stripePaymentId: string): Promise<PurchaseEntity | null>;
	findPurchasesByUser(userId: string): Promise<PurchaseEntity[]>;
	hasProcessedStripeEvent(eventId: string): Promise<boolean>;
	recordStripeEvent(eventId: string, type: string): Promise<void>;
	hasAccess(userId: string, agentId: string): Promise<boolean>;
}
