-- TrackApp — tabla novedades
-- Usada para detectar cambios en los datos y sincronizar el cache offline.
-- Ejecutá una vez en el SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS public.novedades (
    id          SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos pueden leer novedades" ON public.novedades;

CREATE POLICY "Todos pueden leer novedades"
    ON public.novedades
    FOR SELECT
    USING (true);

GRANT SELECT ON TABLE public.novedades TO authenticated;

-- Registro inicial
INSERT INTO public.novedades (descripcion) VALUES ('Versión inicial de TrackApp');
