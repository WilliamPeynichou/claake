import { IsIn, IsObject, IsOptional } from "class-validator";
import type { AdminPermissions } from "../../domain/entities/user.entity.js";

export class UpdateRoleDto {
	@IsIn(["USER", "CREATOR", "ADMIN", "user", "developer", "admin"])
	role!: string;

	@IsOptional()
	@IsObject()
	admin_permissions?: AdminPermissions | null;
}
