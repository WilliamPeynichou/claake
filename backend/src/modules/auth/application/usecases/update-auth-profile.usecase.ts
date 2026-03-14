import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import type { UserResponseDto } from "../../../users/application/dtos/user-response.dto.js";
import { UserTransformer } from "../../../users/application/transformers/user.transformer.js";
import { UserMapper } from "../../../users/infrastructure/mappers/user.mapper.js";
import type { UpdateProfileDto } from "../dtos/update-profile.dto.js";

@Injectable()
export class UpdateAuthProfileUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
		const existingUser = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});

		if (!existingUser) {
			throw new NotFoundException(`User ${userId} not found`);
		}

		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				displayName: dto.display_name,
				avatarUrl: dto.avatar_url,
				bio: dto.bio,
			},
			include: { _count: { select: { agents: true } } },
		});

		return UserTransformer.toDto(UserMapper.toDomain(updatedUser));
	}
}
