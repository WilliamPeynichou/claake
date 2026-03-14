import type { UserEntity } from "../../domain/entities/user.entity.js";
import type { UserResponseDto } from "../dtos/user-response.dto.js";

export class UserTransformer {
	static toDto(entity: UserEntity): UserResponseDto {
		const roleMap: Record<string, string> = {
			USER: "user",
			CREATOR: "developer",
			ADMIN: "admin",
		};
		return {
			id: entity.id,
			email: entity.email,
			full_name: entity.fullName,
			avatar_url: entity.avatarUrl,
			bio: entity.bio,
			role: roleMap[entity.role] ?? "user",
			agents_count: entity.agentsCount,
			created_at: entity.createdAt.toISOString(),
			updated_at: entity.updatedAt.toISOString(),
		};
	}
}
