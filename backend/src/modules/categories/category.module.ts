import { Module } from "@nestjs/common";
import { ListCategoriesUseCase } from "./application/usecases/list-categories.usecase.js";
import { CATEGORY_REPOSITORY } from "./domain/ports/category.repository.port.js";
import { CategoryController } from "./infrastructure/controllers/category.controller.js";
import { PrismaCategoryRepository } from "./infrastructure/repositories/prisma-category.repository.js";

@Module({
	controllers: [CategoryController],
	providers: [
		ListCategoriesUseCase,
		{ provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
	],
})
export class CategoryModule {}
