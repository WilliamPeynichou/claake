import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCollectionDto {
	@IsString()
	@MaxLength(100)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsBoolean()
	is_public?: boolean;
}
