import { Inject, Injectable } from "@nestjs/common";
import {
	PAYMENT_REPOSITORY,
	type PaymentRepositoryPort,
} from "../../domain/ports/payment.repository.port.js";

export interface CreatorEarningsDto {
	total_earnings: number;
	total_platform_fees: number;
	total_sales: number;
	commissions: {
		id: string;
		amount: number;
		platform_fee: number;
		creator_payout: number;
		commission_rate: number;
		sale_number: number;
		agent_id: string;
		created_at: string;
	}[];
}

@Injectable()
export class GetCreatorEarningsUseCase {
	constructor(@Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: PaymentRepositoryPort) {}

	async execute(creatorId: string, limit = 50, offset = 0): Promise<CreatorEarningsDto> {
		const [earnings, commissions] = await Promise.all([
			this.paymentRepo.getCreatorEarnings(creatorId),
			this.paymentRepo.getCreatorCommissions(creatorId, limit, offset),
		]);

		return {
			total_earnings: earnings.totalEarnings,
			total_platform_fees: earnings.totalPlatformFees,
			total_sales: earnings.totalSales,
			commissions: commissions.map((c) => ({
				id: c.id,
				amount: c.amount,
				platform_fee: c.platformFee,
				creator_payout: c.creatorPayout,
				commission_rate: c.commissionRate,
				sale_number: c.saleNumber,
				agent_id: c.agentId,
				created_at: c.createdAt.toISOString(),
			})),
		};
	}
}
