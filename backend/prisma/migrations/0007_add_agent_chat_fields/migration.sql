-- Add MVP chat-facing agent fields
ALTER TABLE "agents" ADD COLUMN "welcome_message" TEXT;
ALTER TABLE "agents" ADD COLUMN "suggested_prompts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "agents" ADD COLUMN "limitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "agents" ADD COLUMN "model_settings" JSONB;
ALTER TABLE "agents" ADD COLUMN "capabilities" JSONB;
