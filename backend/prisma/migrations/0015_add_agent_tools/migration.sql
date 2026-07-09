-- Add agent tool calling configuration
ALTER TABLE "agents" ADD COLUMN "tools" JSONB;
