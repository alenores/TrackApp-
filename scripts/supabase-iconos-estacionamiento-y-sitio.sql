-- Dos tipos más de punto: estacionamiento y sitio.
-- Los puntos que ya existen no cambian.

ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'estacionamiento';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'sitio';
