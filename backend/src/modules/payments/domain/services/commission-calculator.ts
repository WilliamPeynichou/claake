const TIER_1_RATE = 0.2; // 20% for first 100 sales
const TIER_2_RATE = 0.14; // 14% after 100 sales
const TIER_THRESHOLD = 100;

export interface CommissionBreakdown {
	totalAmount: number;
	platformFee: number;
	creatorPayout: number;
	commissionRate: number;
}

export function calculateCommission(
	priceInCents: number,
	totalSalesForAgent: number,
): CommissionBreakdown {
	const rate = totalSalesForAgent < TIER_THRESHOLD ? TIER_1_RATE : TIER_2_RATE;
	const platformFee = Math.round(priceInCents * rate);
	const creatorPayout = priceInCents - platformFee;

	return {
		totalAmount: priceInCents,
		platformFee,
		creatorPayout,
		commissionRate: rate,
	};
}
