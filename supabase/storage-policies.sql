-- =====================================================================
-- PRIVATE STORAGE POLICIES FOR UPLOADED REPORTS
-- =====================================================================
-- These four policies are the same ones supabase/schema.sql creates, kept as a
-- separate file because a hosted project will not let the SQL editor create
-- them.
--
-- The reason is not a missing privilege that can be granted: storage.objects
-- belongs to supabase_storage_admin, and Supabase reserves that role's
-- memberships, so
--
--   grant supabase_storage_admin to postgres;
--
-- fails with "role memberships are reserved, only superusers can grant them".
-- schema.sql therefore detects this, warns, and lets the rest of the migration
-- finish. The dashboard has the access the editor does not, so the bucket and
-- these policies are set up there.
--
-- To apply:
--   1. Storage > Buckets > New bucket. Name "reports", Public bucket OFF.
--   2. Storage > Policies > select the "reports" bucket > New policy.
--   3. Switch that dialog to its SQL tab and paste each block below in turn.
--
-- A medical report must never be readable by URL, so the bucket stays private
-- and every file is addressed only through these policies. Each one keys off
-- the first folder segment, which the app sets to the owner's user id.
-- =====================================================================


-- 1. Downloading. A user may read their own reports and nobody else's.
drop policy if exists "users read their own reports" on storage.objects;
create policy "users read their own reports" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- 2. Uploading. WITH CHECK is what stops an upload landing in another account's
-- folder, which an insert cannot be caught by a USING clause.
drop policy if exists "users upload their own reports" on storage.objects;
create policy "users upload their own reports" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- 3. Renaming or overwriting. USING covers reading the row being changed and
-- WITH CHECK covers where it ends up, so a file cannot be moved out of the
-- caller's own folder and into someone else's.
drop policy if exists "users update their own reports" on storage.objects;
create policy "users update their own reports" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- 4. Deleting.
drop policy if exists "users remove their own reports" on storage.objects;
create policy "users remove their own reports" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );