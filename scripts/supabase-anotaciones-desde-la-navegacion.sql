-- Anotaciones creadas por cualquier usuario desde la navegación, sin señal.
-- Decidió Ale el 2026-09-24.
--
-- Qué cambia y por qué:
-- 1. El sector deja de ser obligatorio. Manda el punto del GPS: si cae o no
--    dentro de un sector no importa.
-- 2. Cada anotación puede tener dos fotos: la grande (hasta 2 MB, se ve con
--    internet en zonas y sectores) y la chica (viaja siempre al celular y es
--    la única que se ve en el cerro).
-- 3. El celular le pone a cada anotación un código propio al crearla sin
--    señal. Si la subida se corta y se reintenta, la base reconoce el código
--    y no la duplica.
-- 4. Se guarda cuándo se marcó de verdad (puede subirse días después) y con
--    qué precisión venía el GPS (vacío = marcada a mano o trazo).
-- 5. Cualquier usuario crea, edita y borra lo suyo. El administrador ya puede
--    todo con la política que existe.
--
-- Si es del administrador o de un usuario no se guarda: sale de la categoría
-- del autor en perfiles, así nunca queda desactualizado.

-- 1. Sector opcional
alter table public.anotaciones
  alter column sector_id drop not null;

-- 2 a 4. Columnas nuevas
alter table public.anotaciones
  add column if not exists foto_chica_url text,
  add column if not exists codigo_local uuid,
  add column if not exists precision_gps_metros real,
  add column if not exists marcada_en timestamptz not null default now();

create unique index if not exists anotaciones_codigo_local_unico
  on public.anotaciones (codigo_local)
  where codigo_local is not null;

create index if not exists ix_anotaciones_perfil
  on public.anotaciones (perfil_id)
  where eliminado_en is null;

-- Los orígenes que existen, más el nuevo: la navegación.
alter table public.anotaciones
  drop constraint if exists anotaciones_origen_valido;
alter table public.anotaciones
  add constraint anotaciones_origen_valido
  check (origen in ('manual', 'google_earth', 'openstreetmap', 'navegacion'));

alter table public.anotaciones
  drop constraint if exists anotaciones_precision_positiva;
alter table public.anotaciones
  add constraint anotaciones_precision_positiva
  check (precision_gps_metros is null or precision_gps_metros >= 0);

-- 5. Permisos por fila para los usuarios
drop policy if exists anotaciones_crear_propias on public.anotaciones;
create policy anotaciones_crear_propias
  on public.anotaciones for insert
  to authenticated
  with check (perfil_id = auth.uid());

drop policy if exists anotaciones_editar_propias on public.anotaciones;
create policy anotaciones_editar_propias
  on public.anotaciones for update
  to authenticated
  using (perfil_id = auth.uid() and eliminado_en is null)
  with check (perfil_id = auth.uid());

-- Nadie vacía la tabla entera: ese permiso saltea la seguridad por fila.
revoke truncate on public.anotaciones from anon, authenticated;

-- Verificación: tiene que devolver una sola fila con todo en true.
select
  (select is_nullable = 'YES' from information_schema.columns
    where table_schema = 'public' and table_name = 'anotaciones'
      and column_name = 'sector_id') as sector_opcional,
  (select count(*) = 4 from information_schema.columns
    where table_schema = 'public' and table_name = 'anotaciones'
      and column_name in ('foto_chica_url', 'codigo_local',
                          'precision_gps_metros', 'marcada_en')) as columnas_nuevas,
  (select count(*) = 2 from pg_policies
    where schemaname = 'public' and tablename = 'anotaciones'
      and policyname in ('anotaciones_crear_propias',
                         'anotaciones_editar_propias')) as permisos_de_usuarios,
  (select relrowsecurity from pg_class
    where oid = 'public.anotaciones'::regclass) as seguridad_por_fila;
