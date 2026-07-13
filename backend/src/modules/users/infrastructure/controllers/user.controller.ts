import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RequirePermission } from "../../../../common/decorators/admin-permission.decorator.js";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { AdminPermissionGuard } from "../../../../common/guards/admin-permission.guard.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { AuthenticatedRequest } from "../../../../common/types/authenticated-request.type.js";
import { AddApiKeyDto } from "../../application/dtos/add-api-key.dto.js";
import { UpdateProfileDto } from "../../application/dtos/update-profile.dto.js";
import { UpdateRoleDto } from "../../application/dtos/update-role.dto.js";
import { GetCreatorProfileUseCase } from "../../application/usecases/get-creator-profile.usecase.js";
import { GetUserProfileUseCase } from "../../application/usecases/get-user-profile.usecase.js";
import { ListUsersUseCase } from "../../application/usecases/list-users.usecase.js";
import { ManageApiKeysUseCase } from "../../application/usecases/manage-api-keys.usecase.js";
import { UpdateUserProfileUseCase } from "../../application/usecases/update-user-profile.usecase.js";
import { UpdateUserRoleUseCase } from "../../application/usecases/update-user-role.usecase.js";

@Controller("users")
export class UserController {
	constructor(
		private readonly listUsers: ListUsersUseCase,
		private readonly updateUserRole: UpdateUserRoleUseCase,
	) {}

	@Get()
	@UseGuards(SupabaseAuthGuard, RolesGuard, AdminPermissionGuard)
	@Roles("ADMIN", "SUPER_ADMIN")
	@RequirePermission("canManageUsers")
	async findAll() {
		return this.listUsers.execute();
	}

	@Patch(":id/role")
	@UseGuards(SupabaseAuthGuard, RolesGuard)
	@Roles("SUPER_ADMIN")
	async updateRole(
		@Param("id") id: string,
		@Body() dto: UpdateRoleDto,
		@CurrentUser() user: { id: string; role: string },
	) {
		return this.updateUserRole.execute(id, dto.role, dto.admin_permissions ?? null, user.role);
	}
}

@Controller("auth")
@UseGuards(SupabaseAuthGuard)
export class AuthController {
	constructor(
		private readonly getUserProfile: GetUserProfileUseCase,
		private readonly updateUserProfile: UpdateUserProfileUseCase,
		private readonly manageApiKeys: ManageApiKeysUseCase,
	) {}

	@Get("profile")
	async profile(@Req() req: AuthenticatedRequest) {
		return this.getUserProfile.execute(req.user.id);
	}

	@Patch("profile")
	async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
		return this.updateUserProfile.execute(req.user.id, {
			displayName: dto.display_name,
			bio: dto.bio,
		});
	}

	@Get("api-keys")
	async listApiKeys(@Req() req: AuthenticatedRequest) {
		return this.manageApiKeys.listKeys(req.user.id);
	}

	@Post("api-keys")
	@Throttle({ default: { ttl: 60_000, limit: 5 } })
	async addApiKey(@Req() req: AuthenticatedRequest, @Body() body: AddApiKeyDto) {
		return this.manageApiKeys.addKey(req.user.id, body.provider, body.label, body.key);
	}

	@Delete("api-keys/:id")
	async removeApiKey(@Req() req: AuthenticatedRequest, @Param("id") keyId: string) {
		await this.manageApiKeys.removeKey(req.user.id, keyId);
		return { deleted: true };
	}
}

@Controller("creators")
export class CreatorController {
	constructor(private readonly getCreatorProfile: GetCreatorProfileUseCase) {}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return this.getCreatorProfile.execute(id);
	}
}
