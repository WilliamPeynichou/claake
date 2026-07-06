import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from "class-validator";

export class SendMessageDto {
	@IsString()
	@MaxLength(10000)
	content!: string;

	@IsOptional()
	@IsEnum(["TEXT", "IMAGE", "VIDEO"])
	content_type?: string;

	/** UUIDs des fichiers uploadés à attacher à ce message (images / PDFs à analyser) */
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsUUID("4", { each: true })
	file_ids?: string[];
}
