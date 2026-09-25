-- Que un borrado se note en todos los celulares.
-- 2026-09-24.
--
-- Qué pasaba: el celular sabe que hay novedades mirando la fecha de cambio más
-- nueva de la tabla. Un usuario común no ve las filas borradas, así que cuando
-- alguien borra una anotación, la fecha más nueva que él ve no cambia: su
-- celular cree que no hay novedades y la anotación borrada sigue en su mapa.
--
-- Qué hace: todo usuario con sesión puede leer también las filas borradas.
-- La app ya pide siempre solo las vivas (`eliminado_en is null`) para
-- mostrarlas; lo único que cambia es que ahora el borrado mueve la fecha.
-- Escribir sigue igual: cada uno lo suyo, el administrador todo.

drop policy if exists anotaciones_ver on public.anotaciones;
create policy anotaciones_ver
  on public.anotaciones for select
  to authenticated
  using (true);

-- Verificación: tiene que devolver una fila con `using` = true.
select policyname, cmd, roles, qual as usando
from pg_policies
where schemaname = 'public' and tablename = 'anotaciones' and policyname = 'anotaciones_ver';
