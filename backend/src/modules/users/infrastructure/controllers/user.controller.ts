import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { UpdateRoleDto } from "../../application/dtos/update-role.dto.js";
import { ListUsersUseCase } from "../../application/usecases/list-users.usecase.js";
import { UpdateUserRoleUseCase } from "../../application/usecases/update-user-role.usecase.js";

@Controller("users")
export class UserController {
	constructor(
		private readonly listUsers: ListUsersUseCase,
		private readonly updateUserRole: UpdateUserRoleUseCase,
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
