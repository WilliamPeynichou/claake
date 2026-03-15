import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminPermissions } from "../../domain/entities/user.entity.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";
import { UserTransformer } from "../transformers/user.transformer.js";

const VALID_ROLES = ["USER", "CREATOR", "ADMIN"];

@Injectable()
export class UpdateUserRoleUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: UserRepositoryPort,
	) {}

	async execute(
		targetUserId: string,
		newRole: string,
		adminPermissions: AdminPermissions | null,
		currentUserRole: string,
	) {
		// Only SUPER_ADMIN can change roles
		if (currentUserRole !== "SUPER_ADMIN") {
			throw new ForbiddenException("Only super admins can manage roles");
		}

		const normalizedRole = newRole.toUpperCase();

		if (!VALID_ROLES.includes(normalizedRole)) {
			throw new ForbiddenException("Cannot assign this role");
		}

		// Cannot modify another SUPER_ADMIN
		const targetUser = await this.userRepository.findById(targetUserId);
		if (!targetUser) {
			throw new NotFoundException("User not found");
		}
		if (targetUser.role === "SUPER_ADMIN") {
			throw new ForbiddenException("Cannot modify a super admin");
		}

		const entity = await this.userRepository.updateRole(
			targetUserId,
			normalizedRole,
			normalizedRole === "ADMIN" ? adminPermissions : null,
		);

		return UserTransformer.toDto(entity);
	}
}
