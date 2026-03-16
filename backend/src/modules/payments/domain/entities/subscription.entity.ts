export class SubscriptionEntity {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly agentId: string,
		public readonly stripeSubId: string | null,
		public readonly status: string,
		public readonly currentPeriodEnd: Date | null,
		public readonly createdAt: Date,
	) {}

	isActive(): boolean {
		return this.status === "ACTIVE";
	}
}
