-- Título de los puntos, aparte de la descripción (comentario).
--
-- En el mapa, al acercarse, se ve solo el título. La descripción completa
-- queda para la ficha. Los puntos que ya existían siguen con comentario y
-- sin título: la app usa el comentario como texto del mapa hasta que se
-- editen.
--
-- La tabla da permisos por columna: sin el GRANT, la base rechaza el
-- guardado aunque la seguridad por fila lo deje pasar.

ALTER TABLE public.anotaciones
  ADD COLUMN IF NOT EXISTS titulo text;

ALTER TABLE public.anotaciones
  DROP CONSTRAINT IF EXISTS anotaciones_titulo_valido;

ALTER TABLE public.anotaciones
  ADD CONSTRAINT anotaciones_titulo_valido
  CHECK (titulo IS NULL OR char_length(titulo) <= 120);

GRANT INSERT (titulo), UPDATE (titulo) ON public.anotaciones TO authenticated;
