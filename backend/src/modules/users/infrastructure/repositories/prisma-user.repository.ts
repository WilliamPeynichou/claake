import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { UserEntity } from "../../domain/entities/user.entity.js";
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
}
