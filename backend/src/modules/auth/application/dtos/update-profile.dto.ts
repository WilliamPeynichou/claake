import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	@MaxLength(120)
	display_name?: string | null;

	@IsOptional()
	@IsUrl()
	avatar_url?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	bio?: string | null;
}
