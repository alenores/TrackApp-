# Esquema de la base de datos — TrackApp

> Creada desde cero el 2026-09-18, desde las decisiones del proyecto.
> **Esta es la fuente de verdad para nombres de tablas y columnas.**
> Si el código dice otra cosa, manda esto.

Todas las tablas cumplen las convenciones fijas: nombres en snake_case español,
borrado lógico con `eliminado_en`, `creado_en` y `actualizado_en` (esta última
se actualiza sola con un disparador), y seguridad por fila activa.

**Nada se borra de verdad.** Marcar `eliminado_en` es borrar. **Toda consulta de
lectura filtra `eliminado_en is null`**, salvo que el caso pida ver lo borrado.

---

## perfiles

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | Es el mismo id del usuario del login. Única excepción a la regla del número correlativo, y es obligada |
| `nombre` | text | |
| `avatar_url` | text | |
| `portada_url` | text | la portada, recortada 2:1 al subirla |
| `actividades` | actividad_ruta[] | lo que practica: ninguna, una o varias. Por defecto vacía (migración `correr_y_actividades_del_perfil`, 2026-10-04) |
| `categoria` | categoria_usuario | `administrador` · `premium` · `normal`. Por defecto `normal` |

**Permisos:** todos ven todos los perfiles. Cada uno edita el suyo. El
administrador puede cambiar la categoría de cualquiera.

**Se crea sola al registrarse** (desde 2026-09-24), con el nombre que el
usuario puso: la función `crear_perfil_al_registrarse`, enganchada al alta de
usuarios. Reemplaza dos funciones de la app vieja que escribían en `profiles`,
una tabla que ya no existe. Script: `scripts/supabase-perfil-al-registrarse.sql`.

---

## zonas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `perfil_id` | uuid | obligatorio |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `lat_norte` `lat_sur` `lon_este` `lon_oeste` | double | el rectángulo, obligatorio |

**El rectángulo de la zona no se descarga nunca.** Existe solo para medir qué
parte del territorio todavía no tiene sector encima.

**Permisos (desde 2026-09-24):** todos los que tienen sesión las ven, también
las borradas —así un borrado mueve la fecha de novedades en todos los
celulares; la app pide siempre solo las vivas—. **Cualquiera crea las suyas y
cambia y borra solo las suyas. El administrador, todas.** Scripts:
`scripts/supabase-anotaciones-desde-la-navegacion.sql` y
`scripts/supabase-anotaciones-borradas-se-notan.sql`.

**Fotos:** en el depósito `fotos-anotaciones`, en la carpeta de quien la subió:
`<perfil>/<anotación>.webp` la grande y `<perfil>/<anotación>-chica.webp` la
chica.

---

## sectores

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `zona_id` | bigint | obligatorio |
| `perfil_id` | uuid | obligatorio |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `lat_norte` `lat_sur` `lon_este` `lon_oeste` | double | el rectángulo, obligatorio |

**Es la unidad que se descarga.**

**Permisos:** todos los que tienen sesión los ven. **Solo el administrador crea,
edita y borra.**

---

## rutas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `perfil_id` | uuid | **obligatorio**, es el creador |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `comentario` | text | |
| `actividades` | actividad_ruta[] | `trekking` · `correr` · `mountain_bike` · `kayak` · `canyoning`. **Al menos una**. `correr` se sumó el 2026-10-04, para toda la app |
| `dificultad_tecnica` | smallint | del 1 al 10 |
| `nivel_esfuerzo` | nivel_esfuerzo | `bajo` · `medio` · `alto` · `muy_alto` |
| `equipo` | text | texto libre |
| `complicaciones` | text | texto libre |
| `largo_km` | numeric | **lo calcula la app desde el archivo. Nunca a mano** |
| `desnivel_positivo_m` | integer | ídem |
| `desnivel_negativo_m` | integer | ídem |
| `geometria` | jsonb | GeoJSON de la ruta, obligatorio. Cada parte de línea lleva `linea`, `desde_m`, `hasta_m`, `paso`, `complejidad`, `observacion` y `comprobado_el` en sus propiedades; ver decisión 033 |
| `archivo_url` | text | el archivo original subido |
| `color` | text | columna anterior; ya no decide el color de la línea en el mapa |
| `lat_norte` `lat_sur` `lon_este` `lon_oeste` | double | el rectángulo que la abarca, obligatorio |

**Permisos:** todos los que tienen sesión las ven. **Solo el creador edita y
borra la suya.**

La dificultad técnica y el esfuerzo de esta tabla describen la ruta completa.
No se usan para colorear ninguna parte. Las partes recién importadas quedan
`por_explorar` y con complejidad vacía hasta que alguien las clasifique. La
edición de partes actualiza el JSON de `geometria` y `actualizado_en`, para que
la puesta al día descargue la nueva línea al celular.

---

## caminos

Creada el 2026-10-06 con la migración `crear_caminos_en_mapas`. Es la capa de
alternativas que se ve en Mapas; **no** es una salida planificada ni pertenece a
una zona o sector. Un archivo con siete líneas elegidas como Caminos produce
siete filas independientes.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `perfil_id` | uuid | autor; no se puede cambiar |
| `nombre` | text | obligatorio, hasta 120 caracteres |
| `descripcion` | text | hasta 2.000 caracteres |
| `actividades` | actividad_ruta[] | al menos una, sin repetir |
| `geometria` | jsonb | GeoJSON `LineString`, coordenadas reales; la base verifica el largo |
| `partes` | jsonb | cubren toda la línea, sin huecos; paso y complejidad por actividad, observación y fecha únicas por parte |
| `largo_m` | numeric | calculado desde la línea |
| `version_forma` | integer | aumenta al corregir la geometría |
| `creado_en`, `actualizado_en`, `eliminado_en` | timestamptz | fechas habituales; retiro lógico |

**Permisos:** todos los usuarios con sesión leen, también los retirados para
detectar bajas al ponerse al día. Administrador y Premium crean; Premium cambia
o retira lo propio y Administrador cualquiera. Normal solo lee. La tabla tiene
seguridad por fila, permisos de lectura y escritura por columna, y no concede
`DELETE` ni `TRUNCATE`. Nadie puede recuperar ni editar un Camino retirado.

La base rechaza coordenadas imposibles, largo falso, partes incoherentes y
fechas de comprobación futuras. El editor y las capas del mapa ya consultan
esta tabla; falta la prueba completa de uso antes de publicar el cambio.

---

## anotaciones

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `sector_id` | bigint | **opcional desde 2026-09-24.** Vacío en las marcadas desde la navegación: manda el punto, no el sector |
| `perfil_id` | uuid | obligatorio. Quién la hizo; de su categoría sale si es del administrador |
| `origen` | text | `manual`, `google_earth`, `openstreetmap` o `navegacion`. La base no acepta otro |
| `tipo` | tipo_anotacion | `punto` o `trazo` |
| `icono` | icono_punto | solo si es punto |
| `color` | text | solo si es trazo |
| `comentario` | text | texto libre, para las dos formas |
| `geometria` | jsonb | el punto o la línea, obligatorio |
| `foto_url` | text | la foto grande, hasta 2 MB. Se ve con internet |
| `foto_chica_url` | text | la foto chica, la que baja al celular y se ve en el cerro |
| `codigo_local` | uuid | el código que le pone el celular a una marca hecha sin señal. Único: evita duplicados al reintentar |
| `marcada_en` | timestamptz | cuándo se marcó de verdad. Por defecto, al crearla |
| `precision_gps_metros` | real | cuánto podía errar el GPS. Vacío si se marcó a mano o es un trazo |
| `creado_en`, `actualizado_en`, `eliminado_en` | timestamptz | como en toda tabla |

**Íconos disponibles:** refugio · arroyo · cumbre · puente · pueblo · cartel ·
fuente · iglesia · cruce · mirador · cascada · tranquera (desde 2026-09-21)

**La base obliga a que sean coherentes:** un punto lleva ícono y no lleva color;
un trazo lleva color y no lleva ícono.

**Permisos (desde 2026-10-07):** todos los que tienen sesión las ven, también
las retiradas para detectar bajas en los celulares; la app pide solo las vivas.
Administrador y Premium crean. Premium cambia o retira las propias;
Administrador, cualquiera. Normal solo lee. La base tampoco permite borrar
físicamente, cambiar el autor ni recuperar una anotación retirada. Migración:
`restringir_anotaciones_del_mapa_por_categoria`.

**Fotos:** en el depósito `fotos-anotaciones`, en la carpeta de quien la subió:
`<perfil>/<anotación>.webp` la grande y `<perfil>/<anotación>-chica.webp` la
chica.

---

## mapas_bajados

**Qué mapas de sector tiene bajados cada usuario en su celular.** No guarda el
mapa: guarda que lo bajaste.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `perfil_id` | uuid | obligatorio. Cada uno ve solo lo suyo |
| `sector_id` | bigint | obligatorio |
| `tipo` | tipo_de_mapa | `simple` o `satelital` |
| `acercamiento_maximo` | smallint | hasta qué nivel se bajó, para rehacerlo igual |

**Un sector puede tener los dos mapas: una fila viva por tipo.** Lo garantiza
un índice único sobre `perfil_id`, `sector_id` y `tipo` que solo cuenta las
filas vivas, así que sacar un mapa y volver a bajarlo reusa la misma fila.
Aplicado por Ale el 2026-09-24 con `scripts/supabase-mapas-bajados-dos-tipos.sql`.

**Por qué existe.** El navegador puede borrar todo lo guardado del celular sin
avisar. Si la única anotación de qué mapas tenías viviera ahí, se iría con el
resto: al abrir con señal los datos vuelven solos, la pantalla se ve perfecta y
los mapas no están. Con esta tabla la app compara lo que la base dice que tenías
contra lo que quedó en el celular y avisa **en casa**. Ver la decisión 021.

**Permisos:** cada usuario ve, crea, edita y borra únicamente sus propias filas.
Nadie ve las de los demás, ni siquiera el administrador.

---

## salidas

**Lo que alguien hizo un día, contado para los demás.** Módulo 100 % con
internet: nada de esto se guarda en el celular. Rehecha desde cero el
2026-10-02 (migración `salidas_desde_cero`): la versión anterior no seguía las
convenciones y tenía una sola fila de prueba.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `perfil_id` | uuid | quien la cargó |
| `titulo` | text | obligatorio, de 1 a 120 letras |
| `fecha` | date | el día de la salida, no el de la carga. Por defecto, hoy en Córdoba |
| `descripcion` | text | opcional |
| `actividades` | actividad_ruta[] | al menos una. Las mismas que una ruta |
| `nivel_esfuerzo` | nivel_esfuerzo | opcional. La misma escala que una ruta |
| `largo_km` | numeric(7,2) | opcional, no negativo |
| `desnivel_positivo_m` | integer | opcional, no negativo |
| `desnivel_negativo_m` | integer | opcional, no negativo |
| `archivo_url` | text | el archivo GPS, en `archivos-ruta`, carpeta del usuario, `salida-<id>.<ext>` |
| `estado` | text | `borrador` · `publicada`. Por defecto `publicada`. El borrador lo ve solo quien lo hizo (decisión 032) |
| `ruta_id` | bigint | la ruta navegada, si se registró navegando una |
| `codigo_local` | uuid | el código del celular de una salida registrada. Único: evita dos borradores si una subida se corta |
| `linea_simplificada` | jsonb | la línea achicada a ~150 puntos `[lon, lat]`, sacada del archivo GPS al cargarlo, para dibujarla sobre la portada. Vacía sin archivo |

Más `creado_en`, `actualizado_en` (con disparador) y `eliminado_en`.

**Permisos:** el usuario logueado ve las salidas publicadas y vivas de todos, y
todas las suyas (borradores y borradas); crea y edita solo las suyas. Un
borrador puede no tener actividad; una publicada, al menos una. No hay permiso de borrar: borrar es
marcar `eliminado_en`.

## salidas_fotos

Hasta cuatro fotos por salida, en `fotos-salidas`, carpeta
`<perfil_id>/<salida_id>/<orden>.webp`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `salida_id` | bigint | obligatorio |
| `orden` | smallint | de 0 a 3. **La 0 es la portada.** Uno por lugar entre las filas vivas |
| `foto_url` | text | obligatorio |

Más `creado_en`, `actualizado_en` y `eliminado_en`.

## salidas_companeros

Los usuarios que fueron a la salida con quien la cargó.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `salida_id` | bigint | obligatorio |
| `perfil_id` | uuid | el compañero. Una vez por salida entre las filas vivas |

Más `creado_en`, `actualizado_en` y `eliminado_en`.

**Permisos de fotos y compañeros:** los ve cualquier usuario logueado; los
crea y edita solo quien cargó la salida (función `es_mi_salida`).

---

## Cómo se detecta que hay novedades

**Mirando `actualizado_en`.** Como lo mantiene un disparador de la base, cambia
solo cada vez que se modifica una fila. La app compara la fecha más nueva que
tiene guardada contra la de la base. **No hay tabla de novedades.**

---

## Depósitos de archivos

| Depósito | Público | Límite | Tipos permitidos |
|---|---|---|---|
| `avatares` | sí | 2 MB | solo webp |
| `fotos-anotaciones` | sí | 2 MB | solo webp |
| `fotos-salidas` | sí | 2 MB | solo webp |
| `archivos-ruta` | sí | 10 MB | gpx, kml, kmz, xml y text/xml |

Los tipos exactos que acepta `archivos-ruta`, leídos de la base el 2026-09-20:
`application/gpx+xml`, `application/vnd.google-earth.kml+xml`,
`application/vnd.google-earth.kmz`, `application/xml` y `text/xml`.

**La clase que la app declara al subir tiene que ser una de esas.** Copiar la
que dice el navegador no sirve: Windows no conoce el `.gpx` y lo entrega como
«un archivo cualquiera», que la base rechaza. Ver R20 en `RIESGOS.md`.

---

## Auditoría de fuentes

**Escrito el 2026-09-18** a partir del script ejecutado contra la base, que se
verificó devolviendo el perfil administrador correctamente.

**Actualizado el 2026-09-21.** La tabla `mapas_bajados` se creó ese día y se
verificó leyendo la base con MCP: seguridad por fila activa, cuatro políticas,
tres índices, el disparador de `actualizado_en` y los cuatro permisos para el
usuario logueado.

**Actualizado el 2026-09-20.** Los tipos que acepta `archivos-ruta` se leyeron
de la base ese día (`storage.buckets`) y reemplazan lo que decía antes, que era
un resumen y le faltaba `text/xml`. El depósito `fotos-anotaciones` se agregó el
mismo día, al crear las anotaciones con foto.
