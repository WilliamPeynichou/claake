import type { UserEntity } from "../entities/user.entity.js";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepositoryPort {
	findAll(): Promise<UserEntity[]>;
	findById(id: string): Promise<UserEntity | null>;
}
