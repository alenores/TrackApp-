-- Permisos del contenido marcado en Mapas, decisión de Ale del 2026-10-05.
-- Administrador y Premium crean; Premium cambia lo suyo; Normal solo lee.
-- No borra filas ni cambia anotaciones existentes.
begin;

-- La categoría se lee de perfiles, no de datos editables del usuario.
drop policy if exists anotaciones_admin on public.anotaciones;
drop policy if exists anotaciones_crear_propias on public.anotaciones;
drop policy if exists anotaciones_editar_propias on public.anotaciones;

create policy anotaciones_crear_en_mapa
  on public.anotaciones for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and eliminado_en is null
    and (select privado.categoria_de_quien_usa()) in ('administrador', 'premium')
  );

create policy anotaciones_editar_propias_en_mapa
  on public.anotaciones for update to authenticated
  using (
    perfil_id = (select auth.uid())
    and eliminado_en is null
    and (select privado.categoria_de_quien_usa()) = 'premium'
  )
  with check (
    perfil_id = (select auth.uid())
    and (select privado.categoria_de_quien_usa()) = 'premium'
  );

create policy anotaciones_editar_todas_en_mapa
  on public.anotaciones for update to authenticated
  using (
    eliminado_en is null
    and (select privado.categoria_de_quien_usa()) = 'administrador'
  )
  with check ((select privado.categoria_de_quien_usa()) = 'administrador');

-- El autor y la fecha de creación quedan fijos. Una marca retirada no se
-- modifica ni se recupera por un pedido directo a la API.
create or replace function privado.cuidar_anotacion_al_cambiar()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.eliminado_en is not null then
    raise exception 'Una anotación retirada no se puede recuperar ni modificar.'
      using errcode = 'check_violation';
  end if;
  if new.perfil_id is distinct from old.perfil_id
     or new.creado_en is distinct from old.creado_en then
    raise exception 'No se puede cambiar quién creó una anotación ni cuándo se creó.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function privado.cuidar_anotacion_al_cambiar() from public;
drop trigger if exists anotaciones_cuidar_al_cambiar on public.anotaciones;
create trigger anotaciones_cuidar_al_cambiar
  before update on public.anotaciones
  for each row execute function privado.cuidar_anotacion_al_cambiar();

-- La autorización por fila no reemplaza los permisos de tabla. En particular,
-- DELETE y TRUNCATE jamás deben llegar a las cuentas de la app.
revoke all on table public.anotaciones from anon, authenticated;
grant select on table public.anotaciones to authenticated;
grant insert (
  sector_id, perfil_id, tipo, icono, color, comentario, geometria,
  foto_url, foto_chica_url, origen, codigo_local, precision_gps_metros, marcada_en
) on table public.anotaciones to authenticated;
grant update (
  sector_id, tipo, icono, color, comentario, geometria, foto_url,
  foto_chica_url, precision_gps_metros, marcada_en, eliminado_en
) on table public.anotaciones to authenticated;

commit;
