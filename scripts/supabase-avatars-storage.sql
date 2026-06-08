-- TrackApp — Fotos de perfil en Storage (opcional)
-- Ejecutá DESPUÉS de supabase-setup.sql (sección 5 profiles)
--
-- 1) Dashboard → Storage → New bucket
--    Nombre: avatars
--    Public bucket: ON
--
-- 2) Subí cada foto (ej. juan.jpg) desde el dashboard
--
-- 3) Copiá la URL pública y guardala en profiles.avatar_url:
--    INSERT INTO public.profiles (id, nombre, avatar_url)
--    VALUES (
--      'UUID-DEL-USUARIO-EN-AUTH',
--      'Juan',
--      'https://TU_PROYECTO.supabase.co/storage/v1/object/public/avatars/juan.jpg'
--    )
--    ON CONFLICT (id) DO UPDATE
--    SET nombre = EXCLUDED.nombre,
--        avatar_url = EXCLUDED.avatar_url,
--        updated_at = now();
--
-- El id debe coincidir con auth.users.id (Authentication → Users → UUID).

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Cada usuario sube solo a avatars/{su-user-id}/...
CREATE POLICY "avatars_upload_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
