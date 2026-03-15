import type { UserEntity } from "../../domain/entities/user.entity.js";
import type { UserResponseDto } from "../dtos/user-response.dto.js";

export class UserTransformer {
	static toDto(entity: UserEntity): UserResponseDto {
		const roleMap: Record<string, string> = {
			USER: "user",
			CREATOR: "developer",
			ADMIN: "admin",
			SUPER_ADMIN: "super_admin",
		};
		return {
			id: entity.id,
			email: entity.email,
			display_name: entity.displayName,
			avatar_url: entity.avatarUrl,
			bio: entity.bio,
			role: roleMap[entity.role] ?? "user",
			admin_permissions: entity.isAdmin() ? entity.adminPermissions : null,
			has_stripe_account: entity.hasStripeAccount(),
			agents_count: entity.agentsCount,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
		};
	}
}
