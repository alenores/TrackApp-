-- Condición de paso «tentativo» en las partes de un Camino.
--
-- Es un posible camino que todavía no se comprobó bien: en el mapa se ve
-- entrecortado como «por explorar», pero más fino y con signos «?».
-- La base valida el valor adentro de cada parte; sin este cambio, guardar
-- «tentativo» se rechaza aunque la app lo ofrezca.

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
        or coalesce(clasificacion ->> 'paso', '') not in ('por_explorar', 'tentativo', 'transitable', 'a_pie', 'sin_paso')
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
