import { Controller, Get } from "@nestjs/common";
import { ListUsersUseCase } from "../../application/usecases/list-users.usecase.js";

@Controller("users")
export class UserController {
	constructor(private readonly listUsers: ListUsersUseCase) {}

	@Get()
	async findAll() {
		return this.listUsers.execute();
	}
}
