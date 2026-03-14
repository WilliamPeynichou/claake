import { Injectable, NotFoundException } from "@nestjs/common";
import { UserMapper } from "../../../users/infrastructure/mappers/user.mapper.js";
import type { UserResponseDto } from "../../../users/application/dtos/user-response.dto.js";
import { UserTransformer } from "../../../users/application/transformers/user.transformer.js";
import { PrismaService } from "../../../../prisma/prisma.service.js";

@Injectable()
export class GetAuthProfileUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string): Promise<UserResponseDto> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { _count: { select: { agents: true } } },
		});

		if (!user) {
			throw new NotFoundException(`User ${userId} not found`);
		}

		return UserTransformer.toDto(UserMapper.toDomain(user));
	}
}
