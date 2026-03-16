export class ReviewEntity {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly agentId: string,
		public readonly rating: number,
		public readonly comment: string | null,
		public readonly verifiedPurchase: boolean,
		public readonly verifiedInteraction: boolean,
		public readonly helpfulCount: number,
		public readonly userName: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	isOwnedBy(userId: string): boolean {
		return this.userId === userId;
	}
}
