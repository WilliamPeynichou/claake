import { Inject, Injectable } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../domain/ports/user.repository.port.js";
import type { UserResponseDto } from "../dtos/user-response.dto.js";
import { UserTransformer } from "../transformers/user.transformer.js";

@Injectable()
export class ListUsersUseCase {
	constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepositoryPort) {}

	async execute(): Promise<UserResponseDto[]> {
		const users = await this.repo.findAll();
		return users.map(UserTransformer.toDto);
	}
}
