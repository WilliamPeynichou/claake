import type { AdminPermissions } from "../../domain/entities/user.entity.js";

export class UpdateRoleDto {
	role!: string;
	admin_permissions?: AdminPermissions | null;
}
