export class CollectionEntity {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string | null,
		public readonly isPublic: boolean,
		public readonly agentIds: string[],
		public readonly userId: string,
		public readonly createdAt: Date,
	) {}

	canBeEditedBy(userId: string): boolean {
		return this.userId === userId;
	}

	canBeViewedBy(userId: string): boolean {
		return this.isPublic || this.userId === userId;
	}
}
