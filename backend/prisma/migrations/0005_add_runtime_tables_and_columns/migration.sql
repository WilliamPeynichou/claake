-- Add runtime chat/upload/activity objects and columns currently present in schema.prisma.
-- The statements are intentionally idempotent where PostgreSQL supports it, so partially
-- migrated environments can converge without breaking fresh database bootstrap.

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageContentType') THEN
        CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageRole') THEN
        CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UploadedFileType') THEN
        CREATE TYPE "UploadedFileType" AS ENUM ('IMAGE', 'DOCUMENT');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portfolio_links" JSONB;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "system_prompt" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verified_interaction" BOOLEAN;
UPDATE "reviews" SET "verified_interaction" = false WHERE "verified_interaction" IS NULL;
ALTER TABLE "reviews" ALTER COLUMN "verified_interaction" SET DEFAULT false;
ALTER TABLE "reviews" ALTER COLUMN "verified_interaction" SET NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content_type" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "uploaded_files" (
    "id" TEXT NOT NULL,
    "type" "UploadedFileType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "session_id" TEXT,
    "message_id" TEXT,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX IF NOT EXISTS "activity_logs_target_type_target_id_idx" ON "activity_logs"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at");

CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_updated_at_idx" ON "chat_sessions"("user_id", "updated_at");

CREATE INDEX IF NOT EXISTS "chat_messages_session_id_created_at_idx" ON "chat_messages"("session_id", "created_at");

CREATE INDEX IF NOT EXISTS "uploaded_files_user_id_idx" ON "uploaded_files"("user_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_agent_id_idx" ON "uploaded_files"("agent_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_session_id_idx" ON "uploaded_files"("session_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_message_id_idx" ON "uploaded_files"("message_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_user_id_fkey') THEN
        ALTER TABLE "chat_sessions"
            ADD CONSTRAINT "chat_sessions_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_agent_id_fkey') THEN
        ALTER TABLE "chat_sessions"
            ADD CONSTRAINT "chat_sessions_agent_id_fkey"
            FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_session_id_fkey') THEN
        ALTER TABLE "chat_messages"
            ADD CONSTRAINT "chat_messages_session_id_fkey"
            FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uploaded_files_user_id_fkey') THEN
        ALTER TABLE "uploaded_files"
            ADD CONSTRAINT "uploaded_files_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uploaded_files_agent_id_fkey') THEN
        ALTER TABLE "uploaded_files"
            ADD CONSTRAINT "uploaded_files_agent_id_fkey"
            FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uploaded_files_session_id_fkey') THEN
        ALTER TABLE "uploaded_files"
            ADD CONSTRAINT "uploaded_files_session_id_fkey"
            FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uploaded_files_message_id_fkey') THEN
        ALTER TABLE "uploaded_files"
            ADD CONSTRAINT "uploaded_files_message_id_fkey"
            FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
