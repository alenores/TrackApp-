-- TrackApp — tablas zonas y sectores
-- Ejecutá una vez en el SQL Editor de Supabase.

-- ─── TABLA ZONAS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.zonas (
    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provincia         TEXT        NOT NULL,
    nombre            TEXT        NOT NULL,
    descripcion       TEXT,
    subido_por_nombre TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver zonas" ON public.zonas;
DROP POLICY IF EXISTS "Usuarios pueden crear sus zonas"        ON public.zonas;
DROP POLICY IF EXISTS "Dueño puede editar su zona"             ON public.zonas;
DROP POLICY IF EXISTS "Dueño puede eliminar su zona"           ON public.zonas;

CREATE POLICY "Usuarios autenticados pueden ver zonas"
    ON public.zonas FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden crear sus zonas"
    ON public.zonas FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dueño puede editar su zona"
    ON public.zonas FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Dueño puede eliminar su zona"
    ON public.zonas FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zonas TO authenticated;

-- ─── TABLA SECTORES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sectores (
    id                UUID             DEFAULT gen_random_uuid() PRIMARY KEY,
    zona_id           UUID             NOT NULL REFERENCES public.zonas(id) ON DELETE CASCADE,
    user_id           UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre            TEXT             NOT NULL,
    descripcion       TEXT,
    -- Cuatro extremos del sector (NE, SE, SO, NO)
    lat_ne            DOUBLE PRECISION NOT NULL,
    lon_ne            DOUBLE PRECISION NOT NULL,
    lat_se            DOUBLE PRECISION NOT NULL,
    lon_se            DOUBLE PRECISION NOT NULL,
    lat_so            DOUBLE PRECISION NOT NULL,
    lon_so            DOUBLE PRECISION NOT NULL,
    lat_no            DOUBLE PRECISION NOT NULL,
    lon_no            DOUBLE PRECISION NOT NULL,
    zoom_minimo       INTEGER          NOT NULL DEFAULT 12 CHECK (zoom_minimo >= 10),
    subido_por_nombre TEXT,
    created_at        TIMESTAMPTZ      DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sectores" ON public.sectores;
DROP POLICY IF EXISTS "Usuarios pueden crear sus sectores"        ON public.sectores;
DROP POLICY IF EXISTS "Dueño puede editar su sector"              ON public.sectores;
DROP POLICY IF EXISTS "Dueño puede eliminar su sector"            ON public.sectores;

CREATE POLICY "Usuarios autenticados pueden ver sectores"
    ON public.sectores FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden crear sus sectores"
    ON public.sectores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dueño puede editar su sector"
    ON public.sectores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Dueño puede eliminar su sector"
    ON public.sectores FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sectores TO authenticated;

-- ─── NOVEDADES — registros iniciales ──────────────────────────────────────────
-- Las acciones sobre zonas/sectores también insertan en novedades para
-- invalidar el cache offline de forma uniforme.
INSERT INTO public.novedades (descripcion) VALUES ('Módulo Zonas disponible');
