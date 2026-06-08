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
--    INSERT INTO public.profiles (id, avatar_url)
--    VALUES (
--      'UUID-DEL-USUARIO-EN-AUTH',
--      'https://TU_PROYECTO.supabase.co/storage/v1/object/public/avatars/juan.jpg'
--    )
--    ON CONFLICT (id) DO UPDATE
--    SET avatar_url = EXCLUDED.avatar_url,
--        updated_at = now();
--
-- El id debe coincidir con auth.users.id (Authentication → Users → UUID).

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
