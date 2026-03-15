import { SetMetadata } from "@nestjs/common";
import type { AdminPermissions } from "../../modules/users/domain/entities/user.entity.js";

export const ADMIN_PERMISSION_KEY = "admin_permission";
export const RequirePermission = (permission: keyof AdminPermissions) =>
	SetMetadata(ADMIN_PERMISSION_KEY, permission);
