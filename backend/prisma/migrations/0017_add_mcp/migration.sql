-- CreateEnum
CREATE TYPE "McpReviewStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "mcp_servers" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "credentials_encrypted" TEXT,
    "review_status" "McpReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "review_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mcp_servers_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "mcp_tools" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "input_schema" JSONB NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mcp_tools_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "mcp_servers_agent_id_idx" ON "mcp_servers"("agent_id");
CREATE INDEX "mcp_servers_review_status_submitted_at_idx" ON "mcp_servers"("review_status", "submitted_at");
CREATE UNIQUE INDEX "mcp_tools_server_id_name_key" ON "mcp_tools"("server_id", "name");
CREATE INDEX "mcp_tools_server_id_is_selected_idx" ON "mcp_tools"("server_id", "is_selected");
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_tools" ADD CONSTRAINT "mcp_tools_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "mcp_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
