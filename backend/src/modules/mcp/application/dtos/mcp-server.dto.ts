import {
	IsBoolean,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateMcpServerDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name!: string;

	@IsUrl({ require_protocol: true, protocols: ["http", "https"] })
	@MaxLength(2048)
	url!: string;

	@IsOptional()
	@IsObject()
	auth?:
		| { type: "NONE" }
		| { type: "BEARER"; token: string }
		| { type: "API_KEY"; header: string; value: string };
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
	@IsObject()
	auth?:
		| { type: "NONE" }
		| { type: "BEARER"; token: string }
		| { type: "API_KEY"; header: string; value: string };

	@IsOptional()
	@IsBoolean()
	enabled?: boolean;
}
