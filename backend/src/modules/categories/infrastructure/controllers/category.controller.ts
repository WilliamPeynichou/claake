import { Controller, Get } from "@nestjs/common";
import { ListCategoriesUseCase } from "../../application/usecases/list-categories.usecase.js";

@Controller("categories")
export class CategoryController {
	constructor(private readonly listCategories: ListCategoriesUseCase) {}

	@Get()
	async findAll() {
		return this.listCategories.execute();
	}
}
