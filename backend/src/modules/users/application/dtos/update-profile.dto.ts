import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	display_name?: string;

	@IsOptional()
	@IsString()
	bio?: string;
}
