-- TrackApp — PASO 2: Storage (bucket gpx-files)
-- Ejecutá DESPUÉS del paso 1 (supabase-setup.sql)
--
-- IMPORTANTE: NO uses "ALTER TABLE storage.objects" — da error 42501
-- (must be owner of table objects). En Supabase el RLS de storage ya está activo.
--
-- Antes: Dashboard → Storage → New bucket → nombre "gpx-files" → Public: ON

DROP POLICY IF EXISTS "gpx_public_read" ON storage.objects;
DROP POLICY IF EXISTS "gpx_authenticated_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "gpx_authenticated_update_own" ON storage.objects;
DROP POLICY IF EXISTS "gpx_authenticated_delete_own" ON storage.objects;

CREATE POLICY "gpx_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'gpx-files');

CREATE POLICY "gpx_authenticated_upload_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "gpx_authenticated_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "gpx_authenticated_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gpx-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Si este script también falla con "must be owner", configurá las policies desde:
-- Dashboard → Storage → gpx-files → Policies → New policy
--
-- Policy 1 — SELECT — public — bucket_id = 'gpx-files'
-- Policy 2 — INSERT — authenticated — bucket_id = 'gpx-files' AND (storage.foldername(name))[1] = auth.uid()::text
-- Policy 3 — UPDATE — authenticated — misma condición
-- Policy 4 — DELETE — authenticated — misma condición
