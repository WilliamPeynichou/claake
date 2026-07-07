-- Add quality fields used to improve agent prompt behavior.
ALTER TABLE "agents" ADD COLUMN "variables" JSONB;
ALTER TABLE "agents" ADD COLUMN "few_shot_examples" JSONB;
ALTER TABLE "agents" ADD COLUMN "output_format" TEXT;
ALTER TABLE "agents" ADD COLUMN "quality_checklist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
