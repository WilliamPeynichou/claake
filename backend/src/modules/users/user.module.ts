import { Module } from "@nestjs/common";
import { GetUserProfileUseCase } from "./application/usecases/get-user-profile.usecase.js";
import { ListUsersUseCase } from "./application/usecases/list-users.usecase.js";
import { UpdateUserProfileUseCase } from "./application/usecases/update-user-profile.usecase.js";
import { UpdateUserRoleUseCase } from "./application/usecases/update-user-role.usecase.js";
import { USER_REPOSITORY } from "./domain/ports/user.repository.port.js";
import {
	AuthController,
	UserController,
} from "./infrastructure/controllers/user.controller.js";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository.js";

@Module({
	controllers: [UserController, AuthController],
	providers: [
		ListUsersUseCase,
		GetUserProfileUseCase,
		UpdateUserProfileUseCase,
		UpdateUserRoleUseCase,
		{ provide: USER_REPOSITORY, useClass: PrismaUserRepository },
	],
})
export class UserModule {}
