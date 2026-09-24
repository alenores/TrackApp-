-- Un sector puede tener los dos mapas bajados: el simple y el satelital.
-- Decidió Ale el 2026-09-24. Antes el índice único dejaba uno solo por sector.
--
-- Cambia el índice único de (perfil_id, sector_id) a (perfil_id, sector_id, tipo),
-- contando solo las filas vivas, igual que antes. No toca datos.

do $$
declare
  indice record;
begin
  for indice in
    select i.relname as nombre
    from pg_index x
    join pg_class i on i.oid = x.indexrelid
    join pg_class t on t.oid = x.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'mapas_bajados'
      and x.indisunique
      and not x.indisprimary
      and pg_get_indexdef(x.indexrelid) ilike '%(perfil_id, sector_id)%'
  loop
    execute format('drop index public.%I', indice.nombre);
  end loop;
end $$;

create unique index if not exists mapas_bajados_un_tipo_por_sector
  on public.mapas_bajados (perfil_id, sector_id, tipo)
  where eliminado_en is null;
