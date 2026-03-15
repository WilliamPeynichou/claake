export type AdminPermissions = {
	canManageUsers: boolean;
	canManageAgents: boolean;
	canManageCategories: boolean;
	canManageReviews: boolean;
	canViewStats: boolean;
	canViewActivity: boolean;
};

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
	canManageUsers: true,
	canManageAgents: true,
	canManageCategories: true,
	canManageReviews: true,
	canViewStats: true,
	canViewActivity: true,
};

export class UserEntity {
	constructor(
		public readonly id: string,
		public readonly email: string,
		public readonly displayName: string | null,
		public readonly avatarUrl: string | null,
		public readonly bio: string | null,
		public readonly role: string,
		public readonly adminPermissions: AdminPermissions | null,
		public readonly stripeAccountId: string | null,
		public readonly agentsCount: number,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	isCreator(): boolean {
		return this.role === "CREATOR" || this.isAdmin();
	}

	isAdmin(): boolean {
		return this.role === "ADMIN" || this.role === "SUPER_ADMIN";
	}

	isSuperAdmin(): boolean {
		return this.role === "SUPER_ADMIN";
	}

	hasPermission(permission: keyof AdminPermissions): boolean {
		if (this.role === "SUPER_ADMIN") return true;
		if (this.role !== "ADMIN") return false;
		return this.adminPermissions?.[permission] ?? false;
	}

	hasStripeAccount(): boolean {
		return this.stripeAccountId !== null;
	}
}
