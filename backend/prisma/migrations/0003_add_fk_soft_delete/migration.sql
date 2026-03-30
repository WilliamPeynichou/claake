-- Migration: add FK constraints and soft delete
-- Feature 1: FK Agent.category -> Category.slug
-- Feature 1: FK Team.ownerId -> User.id
-- Feature 4: Soft delete Agent.deletedAt

-- Add deleted_at column to agents table
ALTER TABLE "agents" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add FK: agents.category -> categories.slug
ALTER TABLE "agents" ADD CONSTRAINT "agents_category_fkey"
  FOREIGN KEY ("category") REFERENCES "categories"("slug")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add FK: teams.owner_id -> users.id
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
