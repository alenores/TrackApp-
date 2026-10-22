-- Un tipo más de punto: campamento, con el ícono de una carpa.
-- Los puntos que ya existen no cambian. Sin esto, la app ofrece el tipo y la
-- base rechaza el guardado (pasó con estacionamiento y sitio).

ALTER TYPE public.icono_punto ADD VALUE IF NOT EXISTS 'campamento';
