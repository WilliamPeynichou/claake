import type { User } from "@prisma/client";
import type { AdminPermissions } from "../../domain/entities/user.entity.js";
import { UserEntity } from "../../domain/entities/user.entity.js";

export class UserMapper {
	static toDomain(raw: User & { _count: { agents: number } }): UserEntity {
		const portfolioLinks = Array.isArray(raw.portfolioLinks)
			? (raw.portfolioLinks as { label: string; url: string }[])
			: [];
		return new UserEntity(
			raw.id,
			raw.email,
			raw.displayName,
			raw.avatarUrl,
			raw.bio,
			raw.role,
			raw.adminPermissions as AdminPermissions | null,
			raw.stripeAccountId,
			raw._count.agents,
			raw.createdAt,
			raw.updatedAt,
			portfolioLinks,
		);
	}
}
