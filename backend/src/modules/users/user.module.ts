import { Module } from "@nestjs/common";
import { AgentModule } from "../agents/agent.module.js";
import { GetCreatorProfileUseCase } from "./application/usecases/get-creator-profile.usecase.js";
import { GetUserProfileUseCase } from "./application/usecases/get-user-profile.usecase.js";
import { ListUsersUseCase } from "./application/usecases/list-users.usecase.js";
import { ManageApiKeysUseCase } from "./application/usecases/manage-api-keys.usecase.js";
import { UpdateUserProfileUseCase } from "./application/usecases/update-user-profile.usecase.js";
import { UpdateUserRoleUseCase } from "./application/usecases/update-user-role.usecase.js";
import { USER_REPOSITORY } from "./domain/ports/user.repository.port.js";
import {
	AuthController,
	CreatorController,
	UserController,
} from "./infrastructure/controllers/user.controller.js";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository.js";

@Module({
	imports: [AgentModule],
	controllers: [UserController, AuthController, CreatorController],
	providers: [
		ListUsersUseCase,
		GetUserProfileUseCase,
		UpdateUserProfileUseCase,
		UpdateUserRoleUseCase,
		GetCreatorProfileUseCase,
		ManageApiKeysUseCase,
		{ provide: USER_REPOSITORY, useClass: PrismaUserRepository },
	],
	exports: [USER_REPOSITORY, ManageApiKeysUseCase],
})
export class UserModule {}
