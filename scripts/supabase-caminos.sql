-- =============================================================================
-- Caminos: las líneas explorables de Mapas (decisiones 034 a 038)
-- =============================================================================
--
-- ESTADO: APLICADA EN TRACKAPP EL 2026-10-06 (migración crear_caminos_en_mapas).
-- Preparada y revisada el 2026-10-06. No trae
-- datos, claves ni secretos: solo estructura, permisos y reglas.
--
-- Qué crea, todo en una sola tanda (si algo falla, no queda nada a medias):
--
--   1. El esquema `privado`, que la API no expone, para las funciones de las
--      reglas de seguridad (así lo pide la guía de seguridad de Supabase).
--   2. La tabla `caminos`: una fila por línea. Las siete líneas del proyecto
--      de Ascochinga serían siete Caminos.
--   3. Las reglas de la base sobre los datos: al menos una actividad, una línea
--      de verdad y partes sin huecos con una clasificación por actividad.
--   4. Los disparadores: la fecha de cambio, el autor fijo y la versión de la
--      forma, que sube sola cuando cambia la línea.
--   5. La seguridad por fila y los permisos, en la misma tanda.
--
-- Lo que NO hace: no toca `rutas`, no crea Circuitos, no migra filas viejas, no
-- asigna Caminos a zonas ni a sectores (decisión 035), no concede DELETE ni
-- TRUNCATE. Retirar un Camino es marcar `eliminado_en`.
--
-- Permisos (decisión de Ale del 2026-10-05, docs/USUARIOS.md):
--   - Todos los que tienen sesión leen todos los Caminos, también los
--     retirados: así los demás celulares se enteran de una baja (riesgo R29).
--     La app pide solo los vivos para mostrarlos.
--   - Administrador y Premium crean Caminos, siempre a su nombre.
--   - Premium edita y retira solo los suyos, mientras estén vivos.
--   - El Administrador edita y retira cualquiera.
--   - Normal solo lee.
--   - Nadie cambia el autor ni la fecha de creación de un Camino ya creado.
--
-- Cómo se guarda una parte, adentro de la columna `partes`:
--   [{ "desde_m": 0, "hasta_m": 812.4,
--      "por_actividad": { "mountain_bike": { "paso": "a_pie", "complejidad": "media" },
--                         "trekking":      { "paso": "transitable", "complejidad": null } },
--      "observacion": "Mucha piedra suelta", "comprobado_el": "2026-10-04" }, ...]
--   Condición y complejidad van por actividad (decisión 036); la observación y
--   la fecha son una sola por parte, compartidas (decisión 038).
--
-- =============================================================================
-- 0. ANTES DE APLICAR: verificación de solo lectura (correr aparte)
-- =============================================================================
-- Estos nombres se verificaron en el catálogo el 2026-10-05 (funciones y
-- disparadores) y el 2026-10-06 (tipos y columnas). Conviene repetirlo justo
-- antes de aplicar, porque esta tanda depende de ellos:
--
--   select typname, array_agg(enumlabel order by enumsortorder)
--     from pg_enum e join pg_type t on t.oid = e.enumtypid
--    where typname in ('actividad_ruta', 'categoria_usuario') group by typname;
--   -- actividad_ruta: trekking, mountain_bike, kayak, canyoning, correr
--   -- categoria_usuario: administrador, premium, normal
--
--   select column_name, udt_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'perfiles'
--      and column_name in ('id', 'categoria', 'eliminado_en');
--
--   select pg_get_functiondef('public.marcar_actualizado_en()'::regprocedure);
--   -- tiene que poner new.actualizado_en = now() y devolver new
--
--   select tgname, pg_get_triggerdef(oid) from pg_trigger
--    where tgrelid = 'public.rutas'::regclass and not tgisinternal;
--   -- t_rutas: BEFORE UPDATE ... marcar_actualizado_en(), el modelo a copiar
--
--   select to_regclass('public.caminos');      -- tiene que dar vacío
--   select to_regnamespace('privado');         -- vacío, o el esquema si ya existe
-- =============================================================================

begin;

-- =============================================================================
-- 1. Esquema privado para las funciones de las reglas
-- =============================================================================
-- La API de Supabase solo expone `public`. Una función con permisos de dueño
-- (security definer) no tiene que poder llamarse desde afuera.

create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated;

-- La categoría de quien está usando la app. Vacía si no tiene perfil vivo, y
-- entonces ninguna regla de escritura lo deja pasar. Lee `perfiles` con
-- permisos de dueño para no depender de las reglas de esa tabla.
create or replace function privado.categoria_de_quien_usa()
returns public.categoria_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.categoria
    from public.perfiles p
   where p.id = (select auth.uid())
     and p.eliminado_en is null
$$;

revoke all on function privado.categoria_de_quien_usa() from public;
grant execute on function privado.categoria_de_quien_usa() to authenticated;

-- Una línea válida usa longitudes y latitudes reales. Se vuelve a medir en
-- la base con la misma fórmula esférica de la app (radio de 6.371.000 m):
-- nadie puede declarar un largo distinto para desplazar los límites de las
-- partes, aunque escriba directamente en la API.
create or replace function privado.geometria_de_camino_valida(
  forma jsonb,
  largo_m numeric
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  punto jsonb;
  lon numeric;
  lat numeric;
  lon_anterior double precision;
  lat_anterior double precision;
  mitad double precision;
  delta_lat double precision;
  delta_lon double precision;
  total double precision := 0;
  cantidad integer := 0;
begin
  if forma is null or forma ->> 'type' is distinct from 'LineString'
    or largo_m is null or largo_m <= 0 then
    return false;
  end if;
  if jsonb_typeof(forma -> 'coordinates') is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(forma -> 'coordinates') < 2 then
    return false;
  end if;

  for punto in select elemento from jsonb_array_elements(forma -> 'coordinates') as p(elemento) loop
    if jsonb_typeof(punto) is distinct from 'array' then
      return false;
    end if;
    if jsonb_array_length(punto) < 2
      or jsonb_typeof(punto -> 0) is distinct from 'number'
      or jsonb_typeof(punto -> 1) is distinct from 'number'
      or exists (
        select 1 from jsonb_array_elements(punto) as componente(valor)
        where jsonb_typeof(valor) <> 'number'
      )
    then
      return false;
    end if;
    lon := (punto ->> 0)::numeric;
    lat := (punto ->> 1)::numeric;
    if lon < -180 or lon > 180 or lat < -90 or lat > 90 then
      return false;
    end if;

    if cantidad > 0 then
      delta_lat := radians(lat::double precision - lat_anterior);
      delta_lon := radians(lon::double precision - lon_anterior);
      mitad := sin(delta_lat / 2) ^ 2
        + cos(radians(lat_anterior)) * cos(radians(lat::double precision))
        * sin(delta_lon / 2) ^ 2;
      mitad := least(1, greatest(0, mitad));
      total := total + 6371000 * 2 * atan2(sqrt(mitad), sqrt(1 - mitad));
    end if;
    lon_anterior := lon::double precision;
    lat_anterior := lat::double precision;
    cantidad := cantidad + 1;
  end loop;

  -- Un centímetro cubre solo la diferencia de redondeo entre los motores.
  return total > 0 and abs(total::numeric - largo_m) <= 0.01;
end;
$$;

revoke all on function privado.geometria_de_camino_valida(jsonb, numeric) from public;
grant execute on function privado.geometria_de_camino_valida(jsonb, numeric) to authenticated;

-- La comprobación es un hecho pasado o de hoy en Córdoba, nunca del futuro.
create or replace function privado.fecha_de_comprobacion_valida(texto text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  fecha date;
begin
  if texto is null then return true; end if;
  if texto !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  begin
    fecha := texto::date;
  exception when others then
    return false;
  end;
  return to_char(fecha, 'YYYY-MM-DD') = texto
    and fecha <= (now() at time zone 'America/Argentina/Cordoba')::date;
end;
$$;

revoke all on function privado.fecha_de_comprobacion_valida(text) from public;
grant execute on function privado.fecha_de_comprobacion_valida(text) to authenticated;

-- Las partes de un Camino cierran: empiezan en 0, cada una arranca donde
-- terminó la anterior, la última termina en el largo de la línea, y cada parte
-- tiene una clasificación por cada actividad del Camino, ni una más ni una
-- menos. La app ya lo cuida; esto es la defensa de la base por su cuenta.
create or replace function privado.partes_de_camino_validas(
  partes jsonb,
  largo_m numeric,
  actividades public.actividad_ruta[]
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  -- Margen para el redondeo de decimales entre la app y la base: un milímetro.
  margen constant numeric := 0.001;
  parte jsonb;
  clasificacion jsonb;
  actividad text;
  anterior numeric := 0;
  desde numeric;
  hasta numeric;
begin
  if partes is null or jsonb_typeof(partes) <> 'array' or jsonb_array_length(partes) = 0 then
    return false;
  end if;
  if actividades is null or cardinality(actividades) = 0 then
    return false;
  end if;
  if cardinality(actividades) <> (select count(distinct a) from unnest(actividades) as a) then
    return false;
  end if;

  for parte in select elemento from jsonb_array_elements(partes) as e(elemento) loop
    if jsonb_typeof(parte) <> 'object'
      or coalesce(jsonb_typeof(parte -> 'desde_m'), '') <> 'number'
      or coalesce(jsonb_typeof(parte -> 'hasta_m'), '') <> 'number'
      or coalesce(jsonb_typeof(parte -> 'por_actividad'), '') <> 'object'
      or coalesce(jsonb_typeof(parte -> 'observacion'), 'null') not in ('string', 'null')
      or coalesce(jsonb_typeof(parte -> 'comprobado_el'), 'null') not in ('string', 'null')
    then
      return false;
    end if;

    desde := (parte ->> 'desde_m')::numeric;
    hasta := (parte ->> 'hasta_m')::numeric;
    if abs(desde - anterior) > margen or hasta <= desde then
      return false;
    end if;
    anterior := hasta;

    if char_length(coalesce(parte ->> 'observacion', '')) > 1000 then
      return false;
    end if;
    if not privado.fecha_de_comprobacion_valida(parte ->> 'comprobado_el') then
      return false;
    end if;

    if (select count(*) from jsonb_object_keys(parte -> 'por_actividad')) <> cardinality(actividades) then
      return false;
    end if;
    foreach actividad in array actividades::text[] loop
      clasificacion := parte -> 'por_actividad' -> actividad;
      if clasificacion is null
        or jsonb_typeof(clasificacion) <> 'object'
        or coalesce(clasificacion ->> 'paso', '') not in ('por_explorar', 'transitable', 'a_pie', 'sin_paso')
        or coalesce(jsonb_typeof(clasificacion -> 'complejidad'), '') not in ('string', 'null')
        or (jsonb_typeof(clasificacion -> 'complejidad') = 'string'
            and (clasificacion ->> 'complejidad') not in ('facil', 'media', 'dificil'))
      then
        return false;
      end if;
    end loop;
  end loop;

  return abs(anterior - largo_m) <= margen;
end;
$$;

revoke all on function privado.partes_de_camino_validas(jsonb, numeric, public.actividad_ruta[]) from public;
grant execute on function privado.partes_de_camino_validas(jsonb, numeric, public.actividad_ruta[]) to authenticated;

-- =============================================================================
-- 2. La tabla
-- =============================================================================

create table public.caminos (
  id bigint generated by default as identity primary key,
  -- Quién lo subió. Sin borrado en cascada: nada se borra de verdad.
  perfil_id uuid not null references public.perfiles (id),
  nombre text not null,
  descripcion text,
  actividades public.actividad_ruta[] not null,
  -- La línea, como GeoJSON: {"type": "LineString", "coordinates": [[lon, lat], ...]}
  geometria jsonb not null,
  -- Las partes, ver el encabezado. Siempre cubren la línea entera.
  partes jsonb not null,
  -- Lo calcula la app desde la línea. Nunca se carga a mano.
  largo_m numeric not null,
  -- Sube sola cada vez que cambia la línea (disparador de abajo).
  version_forma integer not null default 1,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz,

  constraint caminos_nombre_valido
    check (char_length(btrim(nombre)) between 1 and 120),
  constraint caminos_descripcion_valida
    check (descripcion is null or char_length(descripcion) <= 2000),
  constraint caminos_al_menos_una_actividad
    check (cardinality(actividades) >= 1),
  constraint caminos_geometria_es_linea
    check (privado.geometria_de_camino_valida(geometria, largo_m)),
  constraint caminos_largo_positivo
    check (largo_m > 0),
  constraint caminos_version_forma_valida
    check (version_forma >= 1),
  constraint caminos_partes_validas
    check (privado.partes_de_camino_validas(partes, largo_m, actividades))
);

comment on table public.caminos is
  'Líneas explorables de Mapas. Una fila por línea. No pertenecen a zonas ni sectores (decisión 035). Borrado lógico con eliminado_en.';
comment on column public.caminos.partes is
  'Partes de la línea en metros desde el comienzo, con paso y complejidad por actividad y una observación y fecha por parte (decisiones 036 y 038).';
comment on column public.caminos.version_forma is
  'Sube sola cuando cambia geometria. Corregir la línea conserva el mismo Camino (decisión 037).';

-- Las reglas filtran por autor, y la puesta al día busca la fecha de cambio
-- más nueva: las dos columnas llevan índice.
create index caminos_perfil_id_idx on public.caminos (perfil_id);
create index caminos_actualizado_en_idx on public.caminos (actualizado_en desc);

-- =============================================================================
-- 3. Disparadores
-- =============================================================================

-- La fecha de cambio, igual que en las demás tablas (t_<tabla>).
create trigger t_caminos
  before update on public.caminos
  for each row execute function public.marcar_actualizado_en();

-- El autor y la fecha de creación no cambian nunca, ni siquiera por error del
-- administrador. La versión de la forma la decide la base, no la app.
create or replace function privado.cuidar_camino_al_cambiar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Un Camino retirado solo queda como aviso para la puesta al día de los
  -- demás dispositivos. Nadie lo puede reabrir ni seguir editando.
  if old.eliminado_en is not null then
    raise exception 'Un Camino retirado no se puede recuperar ni modificar.'
      using errcode = 'check_violation';
  end if;

  if new.perfil_id is distinct from old.perfil_id then
    raise exception 'No se puede cambiar quién creó un Camino.'
      using errcode = 'check_violation';
  end if;
  if new.creado_en is distinct from old.creado_en then
    raise exception 'No se puede cambiar cuándo se creó un Camino.'
      using errcode = 'check_violation';
  end if;

  if new.geometria is distinct from old.geometria then
    new.version_forma := old.version_forma + 1;
  else
    new.version_forma := old.version_forma;
  end if;

  return new;
end;
$$;

revoke all on function privado.cuidar_camino_al_cambiar() from public;

create trigger caminos_cuidar_al_cambiar
  before update on public.caminos
  for each row execute function privado.cuidar_camino_al_cambiar();

-- =============================================================================
-- 4. Seguridad por fila
-- =============================================================================

alter table public.caminos enable row level security;

-- Leer: todos los que tienen sesión, también los retirados.
create policy caminos_ver
  on public.caminos
  for select
  to authenticated
  using (true);

-- Crear: Administrador y Premium, siempre a su propio nombre y vivo.
create policy caminos_crear
  on public.caminos
  for insert
  to authenticated
  with check (
    perfil_id = (select auth.uid())
    and eliminado_en is null
    and (select privado.categoria_de_quien_usa()) in ('administrador', 'premium')
  );

-- Editar o retirar los propios: Premium, mientras el Camino esté vivo.
create policy caminos_editar_propios
  on public.caminos
  for update
  to authenticated
  using (
    perfil_id = (select auth.uid())
    and eliminado_en is null
    and (select privado.categoria_de_quien_usa()) = 'premium'
  )
  with check (
    perfil_id = (select auth.uid())
  );

-- Editar o retirar cualquiera: el Administrador.
create policy caminos_editar_todos_el_administrador
  on public.caminos
  for update
  to authenticated
  using (
    eliminado_en is null
    and (select privado.categoria_de_quien_usa()) = 'administrador'
  )
  with check ((select privado.categoria_de_quien_usa()) = 'administrador');

-- Sin política de DELETE: nadie borra de verdad.

-- =============================================================================
-- 5. Permisos, en la misma tanda
-- =============================================================================
-- Supabase da todos los permisos sobre cada tabla nueva de `public` a anon y
-- authenticated (también DELETE y TRUNCATE, que no pasan por la seguridad por
-- fila). Se sacan todos y se dan solo los que hacen falta.
--
-- Por columna: al crear, nunca se elige id, versión, fechas ni eliminado_en.
-- Al cambiar, nunca se toca perfil_id, creado_en ni version_forma. Así el
-- autor queda fijo dos veces: por permiso y por disparador.

revoke all on table public.caminos from public, anon, authenticated;
revoke delete, truncate on table public.caminos from service_role;

grant select on table public.caminos to authenticated;

grant insert (perfil_id, nombre, descripcion, actividades, geometria, partes, largo_m)
  on table public.caminos to authenticated;

grant update (nombre, descripcion, actividades, geometria, partes, largo_m, eliminado_en)
  on table public.caminos to authenticated;

commit;

-- =============================================================================
-- 6. DESPUÉS DE APLICAR: verificación de solo lectura (correr aparte)
-- =============================================================================
--
--   select relrowsecurity from pg_class where oid = 'public.caminos'::regclass;   -- true
--
--   select policyname, cmd, roles, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename = 'caminos' order by cmd, policyname;
--   -- 4 políticas: caminos_ver (SELECT), caminos_crear (INSERT),
--   -- caminos_editar_propios y caminos_editar_todos_el_administrador (UPDATE)
--
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'caminos' order by 1, 2;
--   -- authenticated: solo SELECT a nivel de tabla. anon: nada. Nadie: DELETE ni TRUNCATE.
--
--   select grantee, privilege_type, column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'caminos' and grantee = 'authenticated'
--    order by privilege_type, column_name;
--   -- INSERT: actividades, descripcion, geometria, largo_m, nombre, partes, perfil_id
--   -- UPDATE: actividades, descripcion, eliminado_en, geometria, largo_m, nombre, partes
--
--   select tgname from pg_trigger
--    where tgrelid = 'public.caminos'::regclass and not tgisinternal order by 1;
--   -- caminos_cuidar_al_cambiar, t_caminos
--
--   select privado.geometria_de_camino_valida(
--     '{"type":"LineString","coordinates":[[-64.5,-31.4],[-64.5,-31.4]]}'::jsonb, 100
--   ); -- false: no hay línea aunque se declare un largo positivo
--   select privado.geometria_de_camino_valida(
--     '{"type":"LineString","coordinates":[[200,-31.4],[-64.4,-31.4]]}'::jsonb, 100
--   ); -- false: longitud imposible
--   select privado.geometria_de_camino_valida(
--     '{"type":"LineString","coordinates":[[-64.5,-31.4],[-64.5,-31.399]]}'::jsonb,
--     111.194926645
--   ); -- true: 0,001 grados de latitud
--   select privado.geometria_de_camino_valida(
--     '{"type":"LineString","coordinates":[[-64.5,-31.4],[-64.5,-31.399]]}'::jsonb,
--     100
--   ); -- false: largo declarado incorrecto
--   select privado.fecha_de_comprobacion_valida(
--     (now() at time zone 'America/Argentina/Cordoba')::date::text
--   ); -- true: hoy
--   select privado.fecha_de_comprobacion_valida(
--     ((now() at time zone 'America/Argentina/Cordoba')::date + 1)::text
--   ); -- false: mañana
--
-- Las pruebas con cuentas de cada categoría están en el informe de esta tanda.
-- No se prueban inventando filas en la base real.
