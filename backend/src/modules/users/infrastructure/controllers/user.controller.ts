import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { UpdateProfileDto } from "../../application/dtos/update-profile.dto.js";
import type { UpdateRoleDto } from "../../application/dtos/update-role.dto.js";
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
		private readonly getUserProfile: GetUserProfileUseCase,
		private readonly updateUserProfile: UpdateUserProfileUseCase,
	) {}

	@Get()
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
	async profile(@Req() req: any) {
		return this.getUserProfile.execute(req.user.id);
	}

	@Patch("profile")
	async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
		return this.updateUserProfile.execute(req.user.id, {
			displayName: dto.display_name,
			bio: dto.bio,
		});
	}

	@Get("api-keys")
	async listApiKeys(@Req() req: any) {
		return this.manageApiKeys.listKeys(req.user.id);
	}

	@Post("api-keys")
	async addApiKey(@Req() req: any, @Body() body: { provider: string; label: string; key: string }) {
		return this.manageApiKeys.addKey(req.user.id, body.provider, body.label, body.key);
	}

	@Delete("api-keys/:id")
	async removeApiKey(@Req() req: any, @Param("id") keyId: string) {
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
