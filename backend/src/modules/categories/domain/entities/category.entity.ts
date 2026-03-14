export class CategoryEntity {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly description: string,
		public readonly icon: string,
		public readonly agentCount: number,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}
}
