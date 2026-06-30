-- Migration: normalize collections and pipelines with proper join tables
-- Feature 2: collection_agents join table (replaces agentIds String[])
-- Feature 3: pipeline_steps table (replaces agentSequence Json)

-- Drop denormalized columns
ALTER TABLE "collections" DROP COLUMN IF EXISTS "agent_ids";
ALTER TABLE "pipelines" DROP COLUMN IF EXISTS "agent_sequence";

-- Create collection_agents join table
CREATE TABLE "collection_agents" (
    "collection_id" TEXT NOT NULL,
    "agent_id"      TEXT NOT NULL,

    CONSTRAINT "collection_agents_pkey" PRIMARY KEY ("collection_id", "agent_id"),
    CONSTRAINT "collection_agents_collection_id_fkey"
        FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_agents_agent_id_fkey"
        FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create pipeline_steps table
CREATE TABLE "pipeline_steps" (
    "id"          TEXT NOT NULL,
    "step"        INTEGER NOT NULL,
    "config"      JSONB,
    "pipeline_id" TEXT NOT NULL,
    "agent_id"    TEXT NOT NULL,

    CONSTRAINT "pipeline_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pipeline_steps_pipeline_id_step_key" UNIQUE ("pipeline_id", "step"),
    CONSTRAINT "pipeline_steps_pipeline_id_fkey"
        FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pipeline_steps_agent_id_fkey"
        FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
