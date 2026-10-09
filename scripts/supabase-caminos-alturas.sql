-- =============================================================================
-- Alturas y desnivel de cada Camino (decisión 049)
-- =============================================================================
--
-- Las líneas que se importan de Google Earth no traen altura. La app la
-- averigua con el relieve del terreno al guardar el Camino —en la computadora,
-- con conexión— y guarda:
--
--   alturas              {"cada_m": 25, "valores": [altura, altura, ...]}
--                        una altura cada `cada_m` metros desde el comienzo de
--                        la línea, y la última justo en el final.
--   desnivel_positivo_m  lo que se sube recorriendo la línea desde su comienzo.
--   desnivel_negativo_m  lo que se baja en ese mismo sentido.
--
-- Los tres van juntos: o están los tres o no está ninguno. Ninguno se carga a
-- mano. Si la línea cambia y las alturas no se recalcularon en el mismo
-- cambio, la base las borra: una altura vieja sobre una línea nueva sería un
-- dato falso, y vacía la pantalla dice que falta calcularla.
--
-- Se agregan sin obligar: los Caminos que ya existen se completan aparte, y la
-- versión publicada de la app, que todavía no las conoce, sigue guardando.

begin;

-- -----------------------------------------------------------------------------
-- 1. Cómo tienen que ser las alturas
-- -----------------------------------------------------------------------------

create or replace function privado.alturas_de_camino_validas(alturas jsonb, largo_m numeric)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  cada_m numeric;
  valores jsonb;
  valor jsonb;
begin
  if alturas is null then
    return true;
  end if;
  if jsonb_typeof(alturas) <> 'object' then
    return false;
  end if;

  if jsonb_typeof(alturas -> 'cada_m') <> 'number' then
    return false;
  end if;
  cada_m := (alturas ->> 'cada_m')::numeric;
  if cada_m <= 0 then
    return false;
  end if;

  valores := alturas -> 'valores';
  if valores is null or jsonb_typeof(valores) <> 'array' then
    return false;
  end if;
  -- Una altura en el comienzo, una cada `cada_m` metros y una en el final.
  if jsonb_array_length(valores) <> ceil(largo_m / cada_m)::integer + 1 then
    return false;
  end if;

  for valor in select * from jsonb_array_elements(valores) loop
    -- Del mar Muerto al Everest: cualquier cosa fuera de eso es un error.
    if jsonb_typeof(valor) <> 'number'
       or (valor #>> '{}')::numeric < -500
       or (valor #>> '{}')::numeric > 9000 then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function privado.alturas_de_camino_validas(jsonb, numeric) from public;
grant execute on function privado.alturas_de_camino_validas(jsonb, numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Las columnas
-- -----------------------------------------------------------------------------

alter table public.caminos
  add column alturas jsonb,
  add column desnivel_positivo_m integer,
  add column desnivel_negativo_m integer;

alter table public.caminos
  add constraint caminos_alturas_validas
    check (privado.alturas_de_camino_validas(alturas, largo_m)),
  add constraint caminos_alturas_completas
    check (
      (alturas is null and desnivel_positivo_m is null and desnivel_negativo_m is null)
      or (alturas is not null and desnivel_positivo_m is not null and desnivel_negativo_m is not null)
    ),
  add constraint caminos_desniveles_no_negativos
    check (
      (desnivel_positivo_m is null or desnivel_positivo_m >= 0)
      and (desnivel_negativo_m is null or desnivel_negativo_m >= 0)
    );

comment on column public.caminos.alturas is
  'Altura del terreno cada cada_m metros desde el comienzo de la línea, y en el final. La calcula la app con el relieve al guardar; nunca se carga a mano (decisión 049).';
comment on column public.caminos.desnivel_positivo_m is
  'Lo que se sube recorriendo la línea desde su comienzo. Va junto con alturas.';
comment on column public.caminos.desnivel_negativo_m is
  'Lo que se baja recorriendo la línea desde su comienzo. Va junto con alturas.';

-- -----------------------------------------------------------------------------
-- 3. Una línea nueva no conserva alturas viejas
-- -----------------------------------------------------------------------------
-- Se suma al disparador que ya cuida el Camino. Si la línea cambió y las
-- alturas llegaron iguales que antes, nadie las recalculó: se borran.

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
    if new.alturas is not distinct from old.alturas then
      new.alturas := null;
      new.desnivel_positivo_m := null;
      new.desnivel_negativo_m := null;
    end if;
  else
    new.version_forma := old.version_forma;
  end if;

  return new;
end;
$$;

revoke all on function privado.cuidar_camino_al_cambiar() from public;

-- -----------------------------------------------------------------------------
-- 4. Permisos, en la misma tanda
-- -----------------------------------------------------------------------------

grant insert (alturas, desnivel_positivo_m, desnivel_negativo_m)
  on table public.caminos to authenticated;

grant update (alturas, desnivel_positivo_m, desnivel_negativo_m)
  on table public.caminos to authenticated;

commit;

-- =============================================================================
-- DESPUÉS DE APLICAR: verificación de solo lectura (correr aparte)
-- =============================================================================
--
--   select column_name, data_type, is_nullable from information_schema.columns
--    where table_schema = 'public' and table_name = 'caminos'
--      and column_name in ('alturas', 'desnivel_positivo_m', 'desnivel_negativo_m');
--   -- tres filas, las tres aceptan vacío
--
--   select privilege_type, column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'caminos' and grantee = 'authenticated'
--      and column_name in ('alturas', 'desnivel_positivo_m', 'desnivel_negativo_m')
--    order by 1, 2;
--   -- INSERT y UPDATE de las tres
