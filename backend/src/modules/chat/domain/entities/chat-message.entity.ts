export class ChatMessageEntity {
	constructor(
		public readonly id: string,
		public readonly sessionId: string,
		public readonly role: string,
		public readonly contentType: string,
		public readonly content: string,
		public readonly mediaUrl: string | null,
		public readonly metadata: Record<string, unknown> | null,
		public readonly createdAt: Date,
	) {}

	isText(): boolean {
		return this.contentType === "TEXT";
	}

	isMedia(): boolean {
		return this.contentType === "IMAGE" || this.contentType === "VIDEO";
	}
}
