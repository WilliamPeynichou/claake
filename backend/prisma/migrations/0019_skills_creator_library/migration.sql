-- M12 Lot 2: skills become creator-owned and shareable across agents (n-n).

-- 1. New columns / tables
ALTER TABLE "agent_skills" ADD COLUMN "creator_id" TEXT;
ALTER TABLE "agent_skills" ADD COLUMN "dependencies" JSONB;

CREATE TABLE "agent_skill_links" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_skill_links_pkey" PRIMARY KEY ("id")
);

-- 2. Backfill: current direct link becomes creator ownership + one link row
UPDATE "agent_skills" s
SET "creator_id" = a."creator_id"
FROM "agents" a
WHERE a."id" = s."agent_id";

INSERT INTO "agent_skill_links" ("id", "skill_id", "agent_id")
SELECT gen_random_uuid(), s."id", s."agent_id"
FROM "agent_skills" s;

-- 3. Drop orphans (agent deleted between steps) then enforce constraints
DELETE FROM "agent_skills" WHERE "creator_id" IS NULL;
ALTER TABLE "agent_skills" ALTER COLUMN "creator_id" SET NOT NULL;

ALTER TABLE "agent_skills" DROP CONSTRAINT "agent_skills_agent_id_fkey";
DROP INDEX "agent_skills_agent_id_idx";
ALTER TABLE "agent_skills" DROP COLUMN "agent_id";

CREATE INDEX "agent_skills_creator_id_idx" ON "agent_skills"("creator_id");
CREATE UNIQUE INDEX "agent_skill_links_skill_id_agent_id_key" ON "agent_skill_links"("skill_id", "agent_id");
CREATE INDEX "agent_skill_links_agent_id_idx" ON "agent_skill_links"("agent_id");

ALTER TABLE "agent_skills"
ADD CONSTRAINT "agent_skills_creator_id_fkey"
FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_skill_links"
ADD CONSTRAINT "agent_skill_links_skill_id_fkey"
FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_skill_links"
ADD CONSTRAINT "agent_skill_links_agent_id_fkey"
FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
