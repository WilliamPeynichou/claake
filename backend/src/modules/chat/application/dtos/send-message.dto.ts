import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {
	@IsString()
	@MaxLength(10000)
	content!: string;

	@IsOptional()
	@IsEnum(["TEXT", "IMAGE", "VIDEO"])
	content_type?: string;
}
