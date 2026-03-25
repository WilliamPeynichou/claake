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
	countSalesForAgent(agentId: string): Promise<number>;
	createCommission(data: {
		agentId: string;
		creatorId: string;
		buyerId: string;
		amount: number;
		platformFee: number;
		creatorPayout: number;
		commissionRate: number;
		currency: string;
		stripePaymentId?: string;
		saleNumber: number;
	}): Promise<void>;
	getCreatorEarnings(creatorId: string): Promise<{
		totalEarnings: number;
		totalPlatformFees: number;
		totalSales: number;
	}>;
	getCreatorCommissions(
		creatorId: string,
		limit: number,
		offset: number,
	): Promise<
		{
			id: string;
			amount: number;
			platformFee: number;
			creatorPayout: number;
			commissionRate: number;
			saleNumber: number;
			agentId: string;
			createdAt: Date;
		}[]
	>;
	createSubscription(data: {
		userId: string;
		agentId: string;
		stripeSubId: string;
		currentPeriodEnd: Date;
	}): Promise<void>;
	updateSubscriptionStatus(
		stripeSubId: string,
		status: "ACTIVE" | "CANCELLED" | "PAST_DUE",
		currentPeriodEnd?: Date,
	): Promise<void>;
}
