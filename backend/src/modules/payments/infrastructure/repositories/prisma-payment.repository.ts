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
}
