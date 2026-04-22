import {
	IsArray,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from "class-validator";
import { IsPublicUrl } from "../../../../common/validators/is-public-url.validator.js";

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
	@IsPublicUrl()
	config_url?: string;

	@IsOptional()
	@IsString()
	system_prompt?: string;

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
	seller_api_key?: string;

	@IsOptional()
	@IsString()
	seller_api_provider?: string;

	@IsOptional()
	@IsString()
	required_user_provider?: string;

	@IsOptional()
	@IsString()
	docker_image?: string;

	@IsOptional()
	@IsPublicUrl()
	download_url?: string;

	@IsOptional()
	@IsPublicUrl()
	image_url?: string;
}
