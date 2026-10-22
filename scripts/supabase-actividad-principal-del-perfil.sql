-- Aplicada en TrackApp con la migración actividad_principal_del_perfil, 2026-10-22.
alter table public.perfiles add column actividad_principal public.actividad_ruta;
update public.perfiles set actividad_principal = actividades[1] where cardinality(actividades) > 0;
alter table public.perfiles add constraint perfiles_principal_entre_actividades
  check (actividad_principal is null or coalesce(actividad_principal = any(actividades), false));
comment on column public.perfiles.actividad_principal is
  'Actividad principal elegida en el perfil. Debe pertenecer a actividades; null para perfiles pendientes de configurar.';
