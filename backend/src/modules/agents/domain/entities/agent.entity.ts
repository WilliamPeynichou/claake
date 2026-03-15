export class AgentEntity {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly description: string,
		public readonly longDescription: string | null,
		public readonly category: string,
		public readonly tags: string[],
		public readonly models: string[],
		public readonly mode: string,
		public readonly configUrl: string | null,
		public readonly imageUrl: string | null,
		public readonly screenshots: string[],
		public readonly pricingModel: string,
		public readonly price: number,
		public readonly creditCost: number,
		public readonly status: string,
		public readonly permissions: Record<string, unknown> | null,
		public readonly downloadCount: number,
		public readonly rating: number,
		public readonly reviewCount: number,
		public readonly creatorId: string,
		public readonly creatorName: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly systemPrompt: string | null = null,
	) {}

	isOwnedBy(userId: string): boolean {
		return this.creatorId === userId;
	}

	isFree(): boolean {
		return this.pricingModel === "FREE";
	}

	isPublished(): boolean {
		return this.status === "APPROVED";
	}
}
