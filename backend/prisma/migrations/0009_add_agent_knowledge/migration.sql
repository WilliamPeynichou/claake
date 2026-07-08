-- CreateTable
CREATE TABLE "agent_knowledge" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_knowledge_agent_id_idx" ON "agent_knowledge"("agent_id");

-- AddForeignKey
ALTER TABLE "agent_knowledge" ADD CONSTRAINT "agent_knowledge_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
