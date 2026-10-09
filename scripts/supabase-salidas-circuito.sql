-- =============================================================================
-- Salidas vinculadas a Circuitos (decisión 049)
-- =============================================================================
--
-- Rutas se retira: la Salida que se registra navegando queda vinculada al
-- Circuito que se navegaba. `ruta_id` queda por las Salidas viejas y por los
-- registros que estaban en curso en algún celular; nada nuevo la usa.
--
-- `salidas` tiene permisos a nivel de tabla, así que la columna nueva ya queda
-- con permiso de leer y escribir para el usuario logueado, igual que las demás.

begin;

alter table public.salidas
  add column circuito_id bigint references public.circuitos (id);

create index salidas_circuito_id_idx on public.salidas (circuito_id);

comment on column public.salidas.circuito_id is
  'El Circuito que se navegaba al registrar la Salida, si había (decisión 049).';
comment on column public.salidas.ruta_id is
  'En desuso desde el 2026-10-08: Rutas se retiró (decisión 049). Queda por las Salidas viejas.';

commit;
