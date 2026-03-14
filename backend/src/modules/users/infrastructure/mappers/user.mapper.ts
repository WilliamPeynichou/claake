import type { User } from "@prisma/client";
import { UserEntity } from "../../domain/entities/user.entity.js";

export class UserMapper {
	static toDomain(raw: User & { _count: { agents: number } }): UserEntity {
		return new UserEntity(
			raw.id,
			raw.email,
			raw.fullName,
			raw.avatarUrl,
			raw.bio,
			raw.role,
			raw._count.agents,
			raw.createdAt,
			raw.updatedAt,
		);
	}
}
