import { Type } from "class-transformer";
import {
	IsBoolean,
	IsIn,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class McpAuthDto {
	@IsIn(["NONE", "BEARER", "API_KEY"])
	type!: "NONE" | "BEARER" | "API_KEY";

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(4096)
	token?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(128)
	header?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(4096)
	value?: string;
}

export class CreateMcpServerDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name!: string;

	@IsUrl({ require_protocol: true, protocols: ["http", "https"] })
	@MaxLength(2048)
	url!: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => McpAuthDto)
	auth?: McpAuthDto;
}

export class UpdateMcpServerDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsUrl({ require_protocol: true, protocols: ["http", "https"] })
	@MaxLength(2048)
	url?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => McpAuthDto)
	auth?: McpAuthDto;

	@IsOptional()
	@IsBoolean()
	enabled?: boolean;
}
