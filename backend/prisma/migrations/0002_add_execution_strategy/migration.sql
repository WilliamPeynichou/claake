-- CreateEnum
CREATE TYPE "CloudStrategy" AS ENUM ('SELLER_ENDPOINT', 'SELLER_API_KEY', 'USER_API_KEY');

-- CreateEnum
CREATE TYPE "EndpointFormat" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'MISTRAL', 'COHERE', 'DEEPSEEK', 'GROQ', 'XAI', 'PERPLEXITY', 'META', 'TOGETHER', 'FIREWORKS', 'HUGGINGFACE', 'CLAAKE');

-- AlterTable
ALTER TABLE "agents" ADD COLUMN "cloud_strategy" "CloudStrategy",
ADD COLUMN "endpoint_url" TEXT,
ADD COLUMN "endpoint_format" "EndpointFormat",
ADD COLUMN "seller_api_key_encrypted" TEXT,
ADD COLUMN "seller_api_provider" TEXT,
ADD COLUMN "required_user_provider" TEXT,
ADD COLUMN "docker_image" TEXT,
ADD COLUMN "download_url" TEXT;
