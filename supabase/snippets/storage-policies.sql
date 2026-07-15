-- =============================================================================
-- Supabase Storage — Bucket policies
-- Source of truth for bucket ACLs. Apply via Supabase dashboard > SQL editor,
-- or via `supabase db push` if using the local CLI.
--
-- Buckets:
--   agent-images          — public read, authenticated write namespaced by user_id
--   agent-files           — private legacy config files; no new direct browser uploads
--   agent-files-private   — private runtime uploads served by short-lived signed URLs from backend
--
-- Path conventions:
--   agent-images        : {user_id}/{slug}/icon-{timestamp}.{ext}       (flux A — publication)
--   agent-files         : {user_id}/{slug}/{version}.agentjson           (flux A — publication)
--   agent-files-private : uploads/{userId}/{agentId|sessionId|unattached}/{uuid}{ext} (flux B — runtime)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- BUCKET: agent-images
-- ----------------------------------------------------------------------------

-- Anyone can read (public icons)
CREATE POLICY "agent-images: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-images');

-- Authenticated users can insert into their own namespace
CREATE POLICY "agent-images: owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'agent-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files
CREATE POLICY "agent-images: owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'agent-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
CREATE POLICY "agent-images: owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'agent-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------------------------
-- BUCKET: agent-files
-- ----------------------------------------------------------------------------

-- No public read: .agentjson may contain sensitive prompts/configuration.
-- New browser flows parse it locally and do not persist it. Legacy objects stay private.
DROP POLICY IF EXISTS "agent-files: public read" ON storage.objects;

-- Authenticated users can insert into their own namespace (flux A: {user_id}/...)
CREATE POLICY "agent-files: owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'agent-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files (flux A)
CREATE POLICY "agent-files: owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'agent-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files (flux A)
CREATE POLICY "agent-files: owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'agent-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------------------------
-- BUCKET: agent-files-private
-- ----------------------------------------------------------------------------

-- Intentionally no public read policy. Service role bypasses RLS for backend writes,
-- reads and deletes; callers must go through the backend, which returns short-lived
-- signed URLs only after checking the uploaded_files owner/agent/session.
