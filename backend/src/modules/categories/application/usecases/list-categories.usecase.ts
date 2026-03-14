import { Inject, Injectable } from "@nestjs/common";
import {
	CATEGORY_REPOSITORY,
	type CategoryRepositoryPort,
} from "../../domain/ports/category.repository.port.js";
import type { CategoryResponseDto } from "../dtos/category-response.dto.js";
import { CategoryTransformer } from "../transformers/category.transformer.js";

@Injectable()
export class ListCategoriesUseCase {
	constructor(@Inject(CATEGORY_REPOSITORY) private readonly repo: CategoryRepositoryPort) {}

	async execute(): Promise<CategoryResponseDto[]> {
		const categories = await this.repo.findAll();
		return CategoryTransformer.toDtoList(categories);
	}
}
