import { Inject, Injectable } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";
import type { UserResponseDto } from "../dtos/user-response.dto.js";
import { UserTransformer } from "../transformers/user.transformer.js";

@Injectable()
export class UpdateUserProfileUseCase {
	constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepositoryPort) {}

	async execute(
		userId: string,
		data: { displayName?: string; bio?: string },
	): Promise<UserResponseDto> {
		const user = await this.repo.updateProfile(userId, data);
		return UserTransformer.toDto(user);
	}
}
