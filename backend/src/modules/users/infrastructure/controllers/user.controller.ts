import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../../../../common/decorators/roles.decorator.js";
import { RolesGuard } from "../../../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import { ListUsersUseCase } from "../../application/usecases/list-users.usecase.js";

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("users")
export class UserController {
	constructor(private readonly listUsers: ListUsersUseCase) {}

	@Get()
	async findAll() {
		return this.listUsers.execute();
	}
}
