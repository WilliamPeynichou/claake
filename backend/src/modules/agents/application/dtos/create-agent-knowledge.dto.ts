import { IsString, MaxLength, MinLength } from "class-validator";
import { MAX_KNOWLEDGE_CONTENT_CHARS } from "../knowledge.constants.js";

export class CreateAgentKnowledgeDto {
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	title!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(MAX_KNOWLEDGE_CONTENT_CHARS)
	content!: string;
}
