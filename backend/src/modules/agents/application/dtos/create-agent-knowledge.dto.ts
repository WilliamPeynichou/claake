import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateAgentKnowledgeDto {
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	title!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(20000)
	content!: string;
}
