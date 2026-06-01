import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from "class-validator";
import { IsPublicUrl } from "../../../../common/validators/is-public-url.validator.js";

export class CreateAgentDto {
	@IsString()
	@MaxLength(80)
	name!: string;

	@IsString()
	@MaxLength(100)
	slug!: string;

	@IsString()
	@MaxLength(1000)
	description!: string;

	@IsOptional()
	@IsString()
	@MaxLength(5000)
	long_description?: string;

	@IsString()
	@MaxLength(80)
	category!: string;

	@IsArray()
	@ArrayMaxSize(20)
	@MaxLength(40, { each: true })
	tags!: string[];

	@IsArray()
	@ArrayMaxSize(10)
	@MaxLength(80, { each: true })
	models!: string[];

	@IsOptional()
	@IsEnum(["LOCAL", "CLOUD", "HYBRID"])
	mode?: string;

	@IsOptional()
	@IsPublicUrl()
	config_url?: string;

	@IsOptional()
	@IsString()
	@MaxLength(10000)
	system_prompt?: string;

	@IsOptional()
	@IsEnum(["FREE", "ONE_TIME", "SUBSCRIPTION", "PAY_PER_USE"])
	pricing_model?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1_000_000)
	price?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(1_000_000)
	credit_cost?: number;

	@IsOptional()
	permissions?: Record<string, unknown>;

	@IsOptional()
	@IsEnum(["SELLER_ENDPOINT", "SELLER_API_KEY", "USER_API_KEY"])
	cloud_strategy?: string;

	@IsOptional()
	@IsPublicUrl()
	endpoint_url?: string;

	@IsOptional()
	@IsEnum([
		"OPENAI",
		"ANTHROPIC",
		"GOOGLE",
		"MISTRAL",
		"COHERE",
		"DEEPSEEK",
		"GROQ",
		"XAI",
		"PERPLEXITY",
		"META",
		"TOGETHER",
		"FIREWORKS",
		"HUGGINGFACE",
		"CLAAKE",
	])
	endpoint_format?: string;

	@IsOptional()
	@IsString()
	@MaxLength(2048)
	seller_api_key?: string;

	@IsOptional()
	@IsString()
	@MaxLength(80)
	seller_api_provider?: string;

	@IsOptional()
	@IsString()
	@MaxLength(80)
	required_user_provider?: string;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	docker_image?: string;

	@IsOptional()
	@IsPublicUrl()
	download_url?: string;

	@IsOptional()
	@IsPublicUrl()
	image_url?: string;
}
