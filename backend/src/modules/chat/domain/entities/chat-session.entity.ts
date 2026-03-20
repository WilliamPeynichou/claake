export class ChatSessionEntity {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly agentId: string,
		public readonly title: string | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	isOwnedBy(userId: string): boolean {
		return this.userId === userId;
	}

	static generateTitle(firstMessage: string): string {
		const trimmed = firstMessage.trim();
		if (trimmed.length <= 50) return trimmed;
		return `${trimmed.slice(0, 47)}...`;
	}
}
