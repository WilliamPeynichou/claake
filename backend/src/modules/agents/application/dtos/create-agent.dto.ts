import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

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

	@IsNumber()
	@Min(0)
	price!: number;

	@IsOptional()
	@IsEnum(["free", "one_time", "subscription", "pay_per_use"])
	price_type?: string;

	@IsString()
	model!: string;

	@IsOptional()
	@IsEnum(["local", "cloud", "hybrid"])
	mode?: string;

	@IsOptional()
	@IsString()
	version?: string;
}
