import { Injectable } from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { AdminPermissions, UserEntity } from "../../domain/entities/user.entity.js";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.port.js";
import { UserMapper } from "../mappers/user.mapper.js";

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(): Promise<UserEntity[]> {
		const users = await this.prisma.user.findMany({
			include: { _count: { select: { agents: true } } },
			orderBy: { createdAt: "desc" },
		});
		return users.map(UserMapper.toDomain);
	}

	async findById(id: string): Promise<UserEntity | null> {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: { _count: { select: { agents: true } } },
		});
		return user ? UserMapper.toDomain(user) : null;
	}

	async updateRole(
		id: string,
		role: string,
		adminPermissions: AdminPermissions | null,
	): Promise<UserEntity> {
		const user = await this.prisma.user.update({
			where: { id },
			data: {
				role: role as UserRole,
				adminPermissions: adminPermissions ?? undefined,
			},
			include: { _count: { select: { agents: true } } },
		});
		return UserMapper.toDomain(user);
	}
}
