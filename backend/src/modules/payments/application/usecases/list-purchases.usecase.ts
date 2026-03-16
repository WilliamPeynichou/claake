import { Inject, Injectable } from "@nestjs/common";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";
import type { PurchaseResponseDto } from "../dtos/purchase-response.dto.js";

@Injectable()
export class ListPurchasesUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY) private readonly repo: PaymentRepositoryPort,
	) {}

	async execute(userId: string): Promise<PurchaseResponseDto[]> {
		const purchases = await this.repo.findPurchasesByUser(userId);
		return purchases.map((p) => ({
			id: p.id,
			user_id: p.userId,
			agent_id: p.agentId,
			amount: p.amount,
			currency: p.currency,
			created_at: p.createdAt.toISOString(),
		}));
	}
}
