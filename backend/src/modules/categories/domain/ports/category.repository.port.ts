import type { CategoryEntity } from "../entities/category.entity.js";

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");

export interface CategoryRepositoryPort {
	findAll(): Promise<CategoryEntity[]>;
}
