import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserEntity } from "../../domain/entities/user.entity";
import { USER_REPOSITORY } from "../../domain/ports/user.repository.port";
import { UpdateUserRoleUseCase } from "./update-user-role.usecase";

const mockRepo = {
	findAll: jest.fn(),
	findById: jest.fn(),
	updateRole: jest.fn(),
	updateProfile: jest.fn(),
};

function makeUser(role = "USER"): UserEntity {
	return new UserEntity(
		"target-user", "target@example.com", "Target", null, null,
		role, null, null, 0, new Date(), new Date(),
	);
}

describe("UpdateUserRoleUseCase", () => {
	let useCase: UpdateUserRoleUseCase;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UpdateUserRoleUseCase,
				{ provide: USER_REPOSITORY, useValue: mockRepo },
			],
		}).compile();

		useCase = module.get(UpdateUserRoleUseCase);
		jest.clearAllMocks();
	});

	it("only allows SUPER_ADMIN to change roles", async () => {
		await expect(
			useCase.execute("target-user", "ADMIN", null, "ADMIN"),
		).rejects.toThrow(ForbiddenException);
	});

	it("rejects invalid roles", async () => {
		await expect(
			useCase.execute("target-user", "SUPER_ADMIN", null, "SUPER_ADMIN"),
		).rejects.toThrow(ForbiddenException);
	});

	it("cannot modify a SUPER_ADMIN user", async () => {
		mockRepo.findById.mockResolvedValue(makeUser("SUPER_ADMIN"));

		await expect(
			useCase.execute("target-user", "USER", null, "SUPER_ADMIN"),
		).rejects.toThrow(ForbiddenException);
	});

	it("throws NotFoundException for unknown user", async () => {
		mockRepo.findById.mockResolvedValue(null);

		await expect(
			useCase.execute("nonexistent", "ADMIN", null, "SUPER_ADMIN"),
		).rejects.toThrow(NotFoundException);
	});

	it("successfully promotes a USER to ADMIN", async () => {
		const user = makeUser("USER");
		mockRepo.findById.mockResolvedValue(user);

		const updatedUser = new UserEntity(
			"target-user", "target@example.com", "Target", null, null,
			"ADMIN", { canManageUsers: true, canManageAgents: true, canManageCategories: false, canManageReviews: false, canViewStats: true, canViewActivity: false },
			null, 0, new Date(), new Date(),
		);
		mockRepo.updateRole.mockResolvedValue(updatedUser);

		const permissions = {
			canManageUsers: true,
			canManageAgents: true,
			canManageCategories: false,
			canManageReviews: false,
			canViewStats: true,
			canViewActivity: false,
		};

		const result = await useCase.execute("target-user", "admin", permissions, "SUPER_ADMIN");

		expect(mockRepo.updateRole).toHaveBeenCalledWith("target-user", "ADMIN", permissions);
		expect(result.role).toBe("admin");
	});

	it("strips admin permissions when demoting to USER", async () => {
		mockRepo.findById.mockResolvedValue(makeUser("ADMIN"));
		mockRepo.updateRole.mockResolvedValue(makeUser("USER"));

		await useCase.execute("target-user", "user", { canManageUsers: true } as any, "SUPER_ADMIN");

		expect(mockRepo.updateRole).toHaveBeenCalledWith("target-user", "USER", null);
	});
});
