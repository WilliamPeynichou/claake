import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { UpdateProfileDto } from "../../application/dtos/update-profile.dto.js";
import type { UpdateRoleDto } from "../../application/dtos/update-role.dto.js";
import { GetUserProfileUseCase } from "../../application/usecases/get-user-profile.usecase.js";
import { ListUsersUseCase } from "../../application/usecases/list-users.usecase.js";
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
}
