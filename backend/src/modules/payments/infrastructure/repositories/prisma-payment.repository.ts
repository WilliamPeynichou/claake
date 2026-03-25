import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import { PurchaseEntity } from "../../domain/entities/purchase.entity.js";
import type { PaymentRepositoryPort } from "../../domain/ports/payment.repository.port.js";

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async createPurchase(data: {
		userId: string;
		agentId: string;
		amount: number;
		currency: string;
		stripePaymentId?: string;
	}): Promise<PurchaseEntity> {
		const purchase = await this.prisma.purchase.create({
			data: {
				userId: data.userId,
				agentId: data.agentId,
				amount: data.amount,
				currency: data.currency,
				stripePaymentId: data.stripePaymentId,
			},
		});
		return new PurchaseEntity(
			purchase.id,
			purchase.userId,
			purchase.agentId,
			Number(purchase.amount),
			purchase.currency,
			purchase.stripePaymentId,
			purchase.createdAt,
		);
	}

	async findPurchaseByUserAndAgent(
		userId: string,
		agentId: string,
	): Promise<PurchaseEntity | null> {
		const purchase = await this.prisma.purchase.findUnique({
			where: { userId_agentId: { userId, agentId } },
		});
		if (!purchase) return null;
		return new PurchaseEntity(
			purchase.id,
			purchase.userId,
			purchase.agentId,
			Number(purchase.amount),
			purchase.currency,
			purchase.stripePaymentId,
			purchase.createdAt,
		);
	}

	async findPurchasesByUser(userId: string): Promise<PurchaseEntity[]> {
		const purchases = await this.prisma.purchase.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
		return purchases.map(
			(p) =>
				new PurchaseEntity(
					p.id,
					p.userId,
					p.agentId,
					Number(p.amount),
					p.currency,
					p.stripePaymentId,
					p.createdAt,
				),
		);
	}

	async hasAccess(userId: string, agentId: string): Promise<boolean> {
		const purchase = await this.prisma.purchase.findUnique({
			where: { userId_agentId: { userId, agentId } },
		});
		if (purchase) return true;

		const subscription = await this.prisma.subscription.findFirst({
			where: { userId, agentId, status: "ACTIVE" },
		});
		return subscription !== null;
	}

	async countSalesForAgent(agentId: string): Promise<number> {
		return this.prisma.commission.count({ where: { agentId } });
	}

	async createCommission(data: {
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
	}): Promise<void> {
		await this.prisma.commission.create({
			data: {
				agentId: data.agentId,
				creatorId: data.creatorId,
				buyerId: data.buyerId,
				amount: data.amount,
				platformFee: data.platformFee,
				creatorPayout: data.creatorPayout,
				commissionRate: data.commissionRate,
				currency: data.currency,
				stripePaymentId: data.stripePaymentId,
				saleNumber: data.saleNumber,
			},
		});
	}

	async getCreatorEarnings(creatorId: string): Promise<{
		totalEarnings: number;
		totalPlatformFees: number;
		totalSales: number;
	}> {
		const result = await this.prisma.commission.aggregate({
			where: { creatorId },
			_sum: { creatorPayout: true, platformFee: true },
			_count: true,
		});
		return {
			totalEarnings: Number(result._sum.creatorPayout ?? 0),
			totalPlatformFees: Number(result._sum.platformFee ?? 0),
			totalSales: result._count,
		};
	}

	async getCreatorCommissions(
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
	> {
		const rows = await this.prisma.commission.findMany({
			where: { creatorId },
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		});
		return rows.map((r) => ({
			id: r.id,
			amount: Number(r.amount),
			platformFee: Number(r.platformFee),
			creatorPayout: Number(r.creatorPayout),
			commissionRate: Number(r.commissionRate),
			saleNumber: r.saleNumber,
			agentId: r.agentId,
			createdAt: r.createdAt,
		}));
	}

	async createSubscription(data: {
		userId: string;
		agentId: string;
		stripeSubId: string;
		currentPeriodEnd: Date;
	}): Promise<void> {
		await this.prisma.subscription.create({
			data: {
				userId: data.userId,
				agentId: data.agentId,
				stripeSubId: data.stripeSubId,
				status: "ACTIVE",
				currentPeriodEnd: data.currentPeriodEnd,
			},
		});
	}

	async updateSubscriptionStatus(
		stripeSubId: string,
		status: "ACTIVE" | "CANCELLED" | "PAST_DUE",
		currentPeriodEnd?: Date,
	): Promise<void> {
		const sub = await this.prisma.subscription.findFirst({
			where: { stripeSubId },
		});
		if (!sub) return;
		await this.prisma.subscription.update({
			where: { id: sub.id },
			data: {
				status,
				...(currentPeriodEnd && { currentPeriodEnd }),
			},
		});
	}
}
