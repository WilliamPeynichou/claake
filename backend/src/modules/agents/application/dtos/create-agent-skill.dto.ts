import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAgentSkillDto {
	@IsString()
	@MinLength(1)
	@MaxLength(120)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string;
}
