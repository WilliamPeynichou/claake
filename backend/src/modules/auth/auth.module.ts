import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard.js";
import { GetAuthProfileUseCase } from "./application/usecases/get-auth-profile.usecase.js";
import { UpdateAuthProfileUseCase } from "./application/usecases/update-auth-profile.usecase.js";
import { AuthController } from "./infrastructure/controllers/auth.controller.js";

@Module({
	controllers: [AuthController],
	providers: [SupabaseAuthGuard, RolesGuard, GetAuthProfileUseCase, UpdateAuthProfileUseCase],
	exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
