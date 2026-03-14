export class UserEntity {
	constructor(
		public readonly id: string,
		public readonly email: string,
		public readonly displayName: string | null,
		public readonly avatarUrl: string | null,
		public readonly bio: string | null,
		public readonly role: string,
		public readonly stripeAccountId: string | null,
		public readonly agentsCount: number,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	isCreator(): boolean {
		return this.role === "CREATOR" || this.role === "ADMIN";
	}

	hasStripeAccount(): boolean {
		return this.stripeAccountId !== null;
	}
}
