-- Cada usuario nuevo tiene su perfil desde el primer segundo.
-- 2026-09-24.
--
-- Qué pasaba: quedaban dos funciones de la app vieja que escriben en
-- `profiles`, una tabla que ya no existe (hoy es `perfiles`). Si siguen
-- enganchadas al registro, el alta de un usuario nuevo falla entera. Y si no
-- lo están, nadie le crea el perfil: sin perfil, el usuario no puede guardar
-- ninguna anotación, porque la base exige que el autor exista en `perfiles`.
--
-- Qué hace:
-- 1. Desengancha del registro todo lo que llame a las funciones viejas.
-- 2. Borra las tres funciones viejas que apuntan a `profiles`.
-- 3. Crea la función nueva, que escribe en `perfiles` con el nombre que el
--    usuario puso al registrarse, y la engancha al registro.
-- 4. Les crea el perfil a los usuarios que ya existen y no lo tienen.

-- 1. Desenganchar las funciones viejas, se llame como se llame el disparador
do $$
declare
  disparador record;
begin
  for disparador in
    select t.tgname as nombre
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and p.proname in ('handle_new_auth_user', 'handle_auth_user_updated')
  loop
    execute format('drop trigger %I on auth.users', disparador.nombre);
  end loop;
end $$;

-- 2. Borrar las funciones viejas
drop function if exists public.handle_new_auth_user();
drop function if exists public.handle_auth_user_updated();
drop function if exists public.list_app_users();

-- 3. La función nueva
create or replace function public.crear_perfil_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'nombre', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists crear_perfil_al_registrarse on auth.users;
create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row
  execute function public.crear_perfil_al_registrarse();

-- 4. Perfil para los usuarios que ya existen y no lo tienen
insert into public.perfiles (id, nombre)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data->>'nombre', '')), '')
from auth.users u
where not exists (select 1 from public.perfiles p where p.id = u.id)
on conflict (id) do nothing;

-- Verificación: una sola fila. Tiene que decir
-- disparadores_en_el_registro = crear_perfil_al_registrarse,
-- funciones_viejas = 0 y usuarios_sin_perfil = 0.
select
  (select string_agg(t.tgname, ', ')
     from pg_trigger t
     where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal)
    as disparadores_en_el_registro,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('handle_new_auth_user', 'handle_auth_user_updated',
                         'list_app_users'))
    as funciones_viejas,
  (select count(*) from auth.users u
     where not exists (select 1 from public.perfiles p where p.id = u.id))
    as usuarios_sin_perfil;
