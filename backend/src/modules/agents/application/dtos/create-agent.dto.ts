import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateAgentDto {
	@IsString()
	name!: string;

	@IsString()
	slug!: string;

	@IsString()
	description!: string;

	@IsOptional()
	@IsString()
	long_description?: string;

	@IsString()
	category!: string;

	@IsArray()
	@IsString({ each: true })
	tags!: string[];

	@IsArray()
	@IsString({ each: true })
	models!: string[];

	@IsOptional()
	@IsEnum(["LOCAL", "CLOUD", "HYBRID"])
	mode?: string;

	@IsOptional()
	@IsString()
	config_url?: string;

	@IsOptional()
	@IsEnum(["FREE", "ONE_TIME", "SUBSCRIPTION", "PAY_PER_USE"])
	pricing_model?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	price?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	credit_cost?: number;

	@IsOptional()
	permissions?: Record<string, unknown>;
}
