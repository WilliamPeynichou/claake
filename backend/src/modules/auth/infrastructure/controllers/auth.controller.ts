import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../../common/decorators/current-user.decorator.js";
import { SupabaseAuthGuard } from "../../../../common/guards/supabase-auth.guard.js";
import type { CurrentUserType } from "../../../../common/types/current-user.type.js";
import { UpdateProfileDto } from "../../application/dtos/update-profile.dto.js";
import { GetAuthProfileUseCase } from "../../application/usecases/get-auth-profile.usecase.js";
import { UpdateAuthProfileUseCase } from "../../application/usecases/update-auth-profile.usecase.js";

@UseGuards(SupabaseAuthGuard)
@Controller("auth")
export class AuthController {
	constructor(
		private readonly getAuthProfile: GetAuthProfileUseCase,
		private readonly updateAuthProfile: UpdateAuthProfileUseCase,
	) {}

	@Get("profile")
	async getProfile(@CurrentUser() user: CurrentUserType) {
		return this.getAuthProfile.execute(user.id);
	}

	@Patch("profile")
	async updateProfile(
		@CurrentUser() user: CurrentUserType,
		@Body() dto: UpdateProfileDto,
	) {
		return this.updateAuthProfile.execute(user.id, dto);
	}
}
