-- Agregar columna foto_url a la tabla zonas
ALTER TABLE zonas ADD COLUMN IF NOT EXISTS foto_url text;
