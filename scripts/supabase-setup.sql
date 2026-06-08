-- TrackApp — PASO 1: rutas y descargas
-- Supabase → SQL Editor → pegar y Run
-- (Si falló el script anterior en storage, las secciones 1-3 igual pueden haberse aplicado.)

-- ─── 1. Permisos de tabla ───

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rutas TO authenticated;
GRANT SELECT ON TABLE public.rutas TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.descargas TO authenticated;

-- ─── 2. RLS en rutas ───

ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rutas_select_authenticated" ON public.rutas;
DROP POLICY IF EXISTS "rutas_insert_own" ON public.rutas;
DROP POLICY IF EXISTS "rutas_update_own" ON public.rutas;
DROP POLICY IF EXISTS "rutas_delete_own" ON public.rutas;

CREATE POLICY "rutas_select_authenticated"
  ON public.rutas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rutas_insert_own"
  ON public.rutas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rutas_update_own"
  ON public.rutas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rutas_delete_own"
  ON public.rutas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── 3. RLS en descargas ───

ALTER TABLE public.descargas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "descargas_select_own" ON public.descargas;
DROP POLICY IF EXISTS "descargas_insert_own" ON public.descargas;
DROP POLICY IF EXISTS "descargas_delete_own" ON public.descargas;

CREATE POLICY "descargas_select_own"
  ON public.descargas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "descargas_insert_own"
  ON public.descargas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "descargas_delete_own"
  ON public.descargas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─── 4. Nombre del autor en rutas ───

ALTER TABLE public.rutas
  ADD COLUMN IF NOT EXISTS subido_por_nombre text;

-- ─── 5. Directorio de usuarios (profiles) ───
-- auth.users no es consultable desde la app; profiles es la vista pública del listado.
-- Los triggers sincronizan id + nombre; avatar_url se carga manual (ver supabase-avatars-storage.sql).

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre text,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nombre text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Perfil automático al registrarse (y backfill de usuarios ya existentes)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'nombre', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'nombre', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nombre = EXCLUDED.nombre,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_auth_user_updated();

INSERT INTO public.profiles (id, nombre)
SELECT
  u.id,
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'nombre', '')), '')
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles AS p WHERE p.id = u.id
);

-- Ejemplo para asignar nombre y foto (reemplazá UUID y URL):
-- INSERT INTO public.profiles (id, nombre, avatar_url)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'Juan',
--   'https://TU_PROYECTO.supabase.co/storage/v1/object/public/avatars/juan.jpg'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET nombre = EXCLUDED.nombre,
--     avatar_url = EXCLUDED.avatar_url,
--     updated_at = now();
