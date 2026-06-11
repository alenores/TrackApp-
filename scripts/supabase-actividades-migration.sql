-- Migration: add actividades column to rutas table
-- Run this in the Supabase SQL editor

ALTER TABLE public.rutas
  ADD COLUMN IF NOT EXISTS actividades text[] NOT NULL DEFAULT '{}';

-- Optional: add a check constraint to only allow valid values
ALTER TABLE public.rutas
  DROP CONSTRAINT IF EXISTS rutas_actividades_valid;

ALTER TABLE public.rutas
  ADD CONSTRAINT rutas_actividades_valid CHECK (
    actividades <@ ARRAY[
      'trekking', 'correr', 'mountain_bike', 'moto',
      'camioneta', 'canyoning', 'kayak'
    ]::text[]
  );
