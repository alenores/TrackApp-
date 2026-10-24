-- Un tipo más de punto, casa, y la marca Atención en los puntos.
--
-- Atención es solo un aviso visual: el ícono del punto se ve con contorno
-- rojo. No cambia Caminos, Circuitos ni trazos (decisión 078). Arranca en
-- «no» para todos los puntos que ya existen.
--
-- La tabla da permisos por columna: sin el GRANT, la base rechaza el
-- guardado aunque la seguridad por fila lo deje pasar.
-- Las tranqueras y alambrados de OpenStreetMap quedan fijos: nunca llevan
-- Atención, y lo controla la base, no solo la app.

ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'casa';

ALTER TABLE public.anotaciones
  ADD COLUMN IF NOT EXISTS atencion boolean NOT NULL DEFAULT false;

ALTER TABLE public.anotaciones
  ADD CONSTRAINT anotaciones_atencion_solo_en_puntos_propios
  CHECK (NOT atencion OR (tipo = 'punto' AND origen <> 'openstreetmap'));

GRANT INSERT (atencion), UPDATE (atencion) ON public.anotaciones TO authenticated;
