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
	findPurchasesByUser(userId: string): Promise<PurchaseEntity[]>;
	hasAccess(userId: string, agentId: string): Promise<boolean>;
}
