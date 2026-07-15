-- Private runtime uploads: idempotent bucket provisioning and defense-in-depth limits.
-- Apply to staging/prod via Supabase migration tooling. No public SELECT policy is created.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'agent-files-private',
    'agent-files-private',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Legacy agent config bucket must not expose potentially sensitive .agentjson files.
UPDATE storage.buckets
SET public = false
WHERE id = 'agent-files';
DROP POLICY IF EXISTS "agent-files: public read" ON storage.objects;

-- Public URLs to that bucket stop working once private. New flows hydrate agent fields locally and
-- never persist config_url; remove only legacy Supabase public-object references, not external URLs.
UPDATE public.agents
SET config_url = NULL
WHERE config_url LIKE '%/storage/v1/object/public/agent-files/%';

-- Runtime access always goes through backend service role after application ownership checks.
-- Remove legacy client-facing policies if a previous environment created them.
DROP POLICY IF EXISTS "agent-files-private: public read" ON storage.objects;
DROP POLICY IF EXISTS "agent-files-private: authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "agent-files-private: owner read" ON storage.objects;
DROP POLICY IF EXISTS "agent-files-private: owner insert" ON storage.objects;
DROP POLICY IF EXISTS "agent-files-private: owner update" ON storage.objects;
DROP POLICY IF EXISTS "agent-files-private: owner delete" ON storage.objects;
