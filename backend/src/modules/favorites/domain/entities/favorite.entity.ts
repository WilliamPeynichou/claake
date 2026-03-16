export class FavoriteEntity {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly agentId: string,
		public readonly createdAt: Date,
	) {}
}
