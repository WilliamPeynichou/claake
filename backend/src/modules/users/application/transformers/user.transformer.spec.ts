import { FULL_ADMIN_PERMISSIONS, UserEntity } from "../../domain/entities/user.entity";
import { UserTransformer } from "./user.transformer";

describe("UserTransformer", () => {
	it("transforms USER entity to DTO", () => {
		const entity = new UserEntity(
			"user-1",
			"test@example.com",
			"Test User",
			"https://avatar.url",
			"My bio",
			"USER",
			null,
			null,
			3,
			new Date("2025-01-01T00:00:00Z"),
			new Date("2025-01-02T00:00:00Z"),
		);

		const dto = UserTransformer.toDto(entity);

		expect(dto.id).toBe("user-1");
		expect(dto.email).toBe("test@example.com");
		expect(dto.display_name).toBe("Test User");
		expect(dto.avatar_url).toBe("https://avatar.url");
		expect(dto.bio).toBe("My bio");
		expect(dto.role).toBe("user");
		expect(dto.admin_permissions).toBeNull();
		expect(dto.has_stripe_account).toBe(false);
		expect(dto.agents_count).toBe(3);
	});

	it("maps CREATOR role to developer", () => {
		const entity = new UserEntity(
			"u1",
			"e@e.com",
			null,
			null,
			null,
			"CREATOR",
			null,
			null,
			0,
			new Date(),
			new Date(),
		);

		expect(UserTransformer.toDto(entity).role).toBe("developer");
	});

	it("maps ADMIN role and includes permissions", () => {
		const entity = new UserEntity(
			"u1",
			"e@e.com",
			null,
			null,
			null,
			"ADMIN",
			FULL_ADMIN_PERMISSIONS,
			null,
			0,
			new Date(),
			new Date(),
		);

		const dto = UserTransformer.toDto(entity);

		expect(dto.role).toBe("admin");
		expect(dto.admin_permissions).toEqual(FULL_ADMIN_PERMISSIONS);
	});

	it("maps SUPER_ADMIN role", () => {
		const entity = new UserEntity(
			"u1",
			"e@e.com",
			null,
			null,
			null,
			"SUPER_ADMIN",
			null,
			null,
			0,
			new Date(),
			new Date(),
		);

		expect(UserTransformer.toDto(entity).role).toBe("super_admin");
	});

	it("hides admin_permissions for non-admin users", () => {
		const entity = new UserEntity(
			"u1",
			"e@e.com",
			null,
			null,
			null,
			"USER",
			null,
			null,
			0,
			new Date(),
			new Date(),
		);

		expect(UserTransformer.toDto(entity).admin_permissions).toBeNull();
	});
});
