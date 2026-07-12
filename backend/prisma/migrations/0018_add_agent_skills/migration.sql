-- CreateTable
CREATE TABLE "agent_skills" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_skill_resources" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_skills_agent_id_idx" ON "agent_skills"("agent_id");

-- CreateIndex
CREATE INDEX "agent_skill_resources_skill_id_idx" ON "agent_skill_resources"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_skill_resources_skill_id_path_key" ON "agent_skill_resources"("skill_id", "path");

-- AddForeignKey
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skill_resources" ADD CONSTRAINT "agent_skill_resources_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "agent_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
