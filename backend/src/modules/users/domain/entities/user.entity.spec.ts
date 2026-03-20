import { type AdminPermissions, FULL_ADMIN_PERMISSIONS, UserEntity } from "./user.entity";

function makeUser(role = "USER", permissions: AdminPermissions | null = null): UserEntity {
	return new UserEntity(
		"user-1",
		"test@example.com",
		"Test User",
		null,
		"A bio",
		role,
		permissions,
		null,
		3,
		new Date("2025-01-01"),
		new Date("2025-01-02"),
	);
}

describe("UserEntity", () => {
	describe("isCreator", () => {
		it("returns true for CREATOR role", () => {
			expect(makeUser("CREATOR").isCreator()).toBe(true);
		});

		it("returns true for ADMIN role", () => {
			expect(makeUser("ADMIN").isCreator()).toBe(true);
		});

		it("returns false for USER role", () => {
			expect(makeUser("USER").isCreator()).toBe(false);
		});
	});

	describe("isAdmin", () => {
		it("returns true for ADMIN", () => {
			expect(makeUser("ADMIN").isAdmin()).toBe(true);
		});

		it("returns true for SUPER_ADMIN", () => {
			expect(makeUser("SUPER_ADMIN").isAdmin()).toBe(true);
		});

		it("returns false for USER", () => {
			expect(makeUser("USER").isAdmin()).toBe(false);
		});
	});

	describe("isSuperAdmin", () => {
		it("returns true only for SUPER_ADMIN", () => {
			expect(makeUser("SUPER_ADMIN").isSuperAdmin()).toBe(true);
			expect(makeUser("ADMIN").isSuperAdmin()).toBe(false);
		});
	});

	describe("hasPermission", () => {
		it("SUPER_ADMIN always has all permissions", () => {
			const superAdmin = makeUser("SUPER_ADMIN");
			expect(superAdmin.hasPermission("canManageUsers")).toBe(true);
			expect(superAdmin.hasPermission("canManageAgents")).toBe(true);
		});

		it("ADMIN with full permissions has all", () => {
			const admin = makeUser("ADMIN", FULL_ADMIN_PERMISSIONS);
			expect(admin.hasPermission("canManageUsers")).toBe(true);
			expect(admin.hasPermission("canViewStats")).toBe(true);
		});

		it("ADMIN with partial permissions returns correctly", () => {
			const partial: AdminPermissions = {
				canManageUsers: true,
				canManageAgents: false,
				canManageCategories: false,
				canManageReviews: false,
				canViewStats: false,
				canViewActivity: false,
			};
			const admin = makeUser("ADMIN", partial);
			expect(admin.hasPermission("canManageUsers")).toBe(true);
			expect(admin.hasPermission("canManageAgents")).toBe(false);
		});

		it("USER always returns false", () => {
			expect(makeUser("USER").hasPermission("canManageUsers")).toBe(false);
		});
	});

	describe("hasStripeAccount", () => {
		it("returns false when no stripe account", () => {
			expect(makeUser().hasStripeAccount()).toBe(false);
		});

		it("returns true when stripe account exists", () => {
			const user = new UserEntity(
				"u1", "e@e.com", null, null, null, "CREATOR",
				null, "acct_123", 0, new Date(), new Date(),
			);
			expect(user.hasStripeAccount()).toBe(true);
		});
	});
});
