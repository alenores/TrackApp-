# Encargo para Claude — guardado y permisos de Caminos, fase 2

**Estado:** listo para copiar a Claude. Esta etapa prepara código y SQL para
revisión. **No aplica cambios a la base real ni modifica pantallas.**

Trabajás en `C:\Users\Usuario\Desktop\TrackApp`. Leé primero `AGENTS.md`,
`docs/planes/2026-10-05-mapas-caminos-circuitos.md`, las decisiones 034 a 038,
`docs/USUARIOS.md`, `docs/SCHEMA.md`,
`docs/planes/auditoria-caminos-claude.md` y los cinco archivos de
`lib/caminos/` que entregaste. Inspeccioná `git status` antes de editar: hay
un prototipo viejo sin confirmar y cambios posteriores de Codex. **No
restaures, borres ni reformatees esos cambios.** La decisión 037 fue aclarada
por Alejandro después de tu entrega: corregir el dibujo conserva condición,
complejidad, observación y fecha de las partes que siguen en la línea. La
decisión 038 fija una observación y fecha únicas por parte, compartidas por
sus actividades. El código actual de `lib/caminos/` ya refleja ambas.

## Objetivo de esta tanda

Prepará el guardado de Caminos como contenido de **Mapas**, separado de la
tabla y las pantallas actuales de Rutas. No implementes Circuitos.

1. **SQL nuevo en `scripts/supabase-caminos.sql`, sin ejecutarlo.** Proponé una
   tabla `caminos` con identificador, autor `perfil_id`, nombre, descripción,
   una o más actividades de la lista existente, la línea, sus partes, largo,
   versión de la forma, fechas `creado_en` y `actualizado_en` y borrado lógico
   `eliminado_en`. Una fila representa una sola línea; siete líneas de
   Ascochinga serían siete Caminos. Condición y complejidad van por actividad
   en cada parte; observación y fecha son únicas por parte. No pongas
   `zona_id` ni `sector_id`: solo sirven para cobertura de descargas.
   Usá nombres de columnas en español y `snake_case`; verificá los nombres
   existentes en el catálogo antes de referirte a tipos, perfiles, funciones
   o disparadores. No leas ni uses filas antiguas como ejemplos.
2. **Permisos en el mismo SQL.** Lectura para usuarios con sesión, incluyendo
   filas con borrado lógico para que los demás dispositivos detecten bajas;
   la app filtrará `eliminado_en is null` para la vista normal. Administrador
   y Premium pueden crear Caminos. Premium solo edita o retira los suyos;
   Administrador edita o retira cualquiera. Normal solo lee. Nadie puede
   cambiar el autor de un Camino ya creado. No concedas `DELETE` ni
   `TRUNCATE`: retirar es actualizar `eliminado_en`. Incluí RLS, políticas,
   `GRANT` y disparador de `actualizado_en` en la misma tanda. Revisá la
   documentación oficial vigente de Supabase para las reglas de seguridad.
3. **Capa de datos y acciones de servidor nuevas.** Podés crear
   `lib/caminos/datos.ts`, `lib/caminos/permisos.ts`, sus pruebas y
   `app/actions/caminos.ts`. Apoyate en las funciones puras ya verificadas de
   `lib/caminos/partes.ts`; no dupliques su lógica. Prepará crear un Camino,
   leerlo, editar línea, clasificar partes por actividad, cambiar observación
   y fecha, cambiar actividades y retirarlo con borrado lógico. Cada cambio
   debe preservar autor y detectar una edición concurrente, para que una
   persona no pise en silencio la clasificación de otra. El servidor valida
   permisos y datos además de las políticas de la base. Errores en voseo:
   explican qué pasó y qué hacer. Para listas, usá páginas ordenadas por
   columna única y verificá que llegaron todas; la base puede cortar a 1000.
4. **Pruebas relevantes.** Cubrí la traducción entre fila de base y Camino,
   el rechazo de un Camino incompleto, el control de autor/categoría y el
   conflicto de edición. El SQL debe poder revisarse sin contener secretos.
   No pruebes permisos inventando datos en la base real. Indicá claramente
   qué pruebas de RLS faltarán cuando se aplique el SQL.

## Límite exacto de archivos

Podés **crear o editar** solamente:

- `scripts/supabase-caminos.sql`;
- archivos nuevos bajo `lib/caminos/` para datos, permisos y sus pruebas;
- `app/actions/caminos.ts` (archivo nuevo).

Leé el resto si hace falta, pero no edites `types/database.ts`, los cinco
archivos de la fase 1 bajo `lib/caminos/`, `components/`, otras acciones,
`lib/offline/`, `lib/rutas/`, `lib/anotaciones/`, documentación, ni el
prototipo local. Si una adaptación fuera imprescindible fuera de tu alcance,
explicala al entregar; no la hagas en esta tanda. No corras SQL contra la
base real, no hagas commit ni push, no publiques ni cambies permisos reales.

## Verificación y entrega

Ejecutá las pruebas nuevas, `npx tsc --noEmit` y `npm run lint`. Al cerrar,
respondé en español claro con: qué quedó preparado, resultados exactos,
archivos nuevos, qué parte no se puede verificar hasta aplicar el SQL y
cualquier decisión que realmente falte. **Detenete ahí**. Codex revisará
el SQL y el código antes de decidir la integración y las pruebas en la base.
