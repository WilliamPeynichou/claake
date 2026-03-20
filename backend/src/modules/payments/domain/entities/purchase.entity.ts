export class PurchaseEntity {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly agentId: string,
		public readonly amount: number,
		public readonly currency: string,
		public readonly stripePaymentId: string | null,
		public readonly createdAt: Date,
	) {}
}
