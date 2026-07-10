-- Milestone 9: chunked knowledge embeddings (pgvector already enabled in 0001).
ALTER TABLE "agent_knowledge" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "agent_knowledge_chunks" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "knowledge_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_knowledge_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_knowledge_chunks_knowledge_id_chunk_index_key"
ON "agent_knowledge_chunks"("knowledge_id", "chunk_index");
CREATE INDEX "agent_knowledge_chunks_agent_id_idx" ON "agent_knowledge_chunks"("agent_id");
CREATE INDEX "agent_knowledge_chunks_knowledge_id_idx" ON "agent_knowledge_chunks"("knowledge_id");
-- IVFFlat becomes useful only after enough rows exist; cosine operator still works without it.

ALTER TABLE "agent_knowledge_chunks"
ADD CONSTRAINT "agent_knowledge_chunks_agent_id_fkey"
FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_chunks"
ADD CONSTRAINT "agent_knowledge_chunks_knowledge_id_fkey"
FOREIGN KEY ("knowledge_id") REFERENCES "agent_knowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
