import { IsString, MaxLength, MinLength } from "class-validator";

export class AddApiKeyDto {
	@IsString()
	@MaxLength(50)
	provider!: string;

	@IsString()
	@MaxLength(100)
	label!: string;

	@IsString()
	@MinLength(8)
	@MaxLength(500)
	key!: string;
}
