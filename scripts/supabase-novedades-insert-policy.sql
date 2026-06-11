-- Parche: permitir a usuarios autenticados insertar en novedades.
-- Ejecutá en el SQL Editor de Supabase después de supabase-novedades.sql

DROP POLICY IF EXISTS "Autenticados pueden insertar novedades" ON public.novedades;

CREATE POLICY "Autenticados pueden insertar novedades"
    ON public.novedades
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

GRANT INSERT ON TABLE public.novedades TO authenticated;
