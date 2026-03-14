export class UserEntity {
	constructor(
		public readonly id: string,
		public readonly email: string,
		public readonly fullName: string | null,
		public readonly avatarUrl: string | null,
		public readonly bio: string | null,
		public readonly role: string,
		public readonly agentsCount: number,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}
}
