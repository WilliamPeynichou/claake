import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";
import type { UserResponseDto } from "../dtos/user-response.dto.js";
import { UserTransformer } from "../transformers/user.transformer.js";

@Injectable()
export class GetUserProfileUseCase {
	constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepositoryPort) {}

	async execute(userId: string): Promise<UserResponseDto> {
		const user = await this.repo.findById(userId);
		if (!user) {
			throw new NotFoundException(`User ${userId} not found`);
		}
		return UserTransformer.toDto(user);
	}
}
