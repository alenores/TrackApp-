-- Tipos de punto nuevos: agua, escalada, terreno y objeto.
--
-- Se suman a icono_punto en la misma tanda que la interfaz, porque si la
-- base no los tiene el guardado se rechaza (regla de SCHEMA.md).

ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'escalada';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'posible_escalada';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'lago';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'laguna';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'juntura';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'quebrada';
ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'objeto';
