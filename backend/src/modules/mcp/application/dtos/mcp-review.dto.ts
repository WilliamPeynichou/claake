import {
	ArrayMaxSize,
	ArrayUnique,
	IsArray,
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
} from "class-validator";

export class SelectMcpToolsDto {
	@IsArray()
	@ArrayMaxSize(50)
	@ArrayUnique()
	@IsString({ each: true })
	tool_ids!: string[];
}

export class ReviewMcpServerDto {
	@IsIn(["approve", "reject", "suspend"])
	decision!: "approve" | "reject" | "suspend";

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	reason?: string;
}
