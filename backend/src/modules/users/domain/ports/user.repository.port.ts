import type { AdminPermissions, UserEntity } from "../entities/user.entity.js";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepositoryPort {
	findAll(): Promise<UserEntity[]>;
	findById(id: string): Promise<UserEntity | null>;
	updateRole(
		id: string,
		role: string,
		adminPermissions: AdminPermissions | null,
	): Promise<UserEntity>;
	updateProfile(
		id: string,
		data: { displayName?: string; bio?: string },
	): Promise<UserEntity>;
	getApiKeysEncrypted(userId: string): Promise<string | null>;
	setApiKeysEncrypted(userId: string, data: string | null): Promise<void>;
}
