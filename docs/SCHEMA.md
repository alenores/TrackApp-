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
| `categoria` | categoria_usuario | `administrador` · `premium` · `normal`. Por defecto `normal` |

**Permisos:** todos ven todos los perfiles. Cada uno edita el suyo. El
administrador puede cambiar la categoría de cualquiera.

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

**Permisos:** todos los que tienen sesión las ven. **Solo el administrador crea,
edita y borra.**

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
| `actividades` | actividad_ruta[] | `trekking` · `mountain_bike` · `kayak` · `canyoning`. **Al menos una** |
| `dificultad_tecnica` | smallint | del 1 al 10 |
| `nivel_esfuerzo` | nivel_esfuerzo | `bajo` · `medio` · `alto` · `muy_alto` |
| `equipo` | text | texto libre |
| `complicaciones` | text | texto libre |
| `largo_km` | numeric | **lo calcula la app desde el archivo. Nunca a mano** |
| `desnivel_positivo_m` | integer | ídem |
| `desnivel_negativo_m` | integer | ídem |
| `geometria` | jsonb | la línea del recorrido, obligatorio |
| `archivo_url` | text | el archivo original subido |
| `lat_norte` `lat_sur` `lon_este` `lon_oeste` | double | el rectángulo que la abarca, obligatorio |

**Permisos:** todos los que tienen sesión las ven. **Solo el creador edita y
borra la suya.**

---

## anotaciones

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | número correlativo |
| `sector_id` | bigint | obligatorio. **Pertenecen al territorio, no a la ruta** |
| `perfil_id` | uuid | obligatorio |
| `tipo` | tipo_anotacion | `punto` o `trazo` |
| `icono` | icono_punto | solo si es punto |
| `color` | text | solo si es trazo |
| `comentario` | text | texto libre, para las dos formas |
| `geometria` | jsonb | el punto o la línea, obligatorio |

**Íconos disponibles:** refugio · arroyo · cumbre · puente · pueblo · cartel ·
fuente · iglesia · cruce · mirador · cascada

**La base obliga a que sean coherentes:** un punto lleva ícono y no lleva color;
un trazo lleva color y no lleva ícono.

**Permisos:** todos los que tienen sesión las ven. **Solo el administrador crea,
edita y borra.**

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

**Un sector tiene un solo mapa a la vez.** Lo garantiza un índice único sobre
`perfil_id` y `sector_id` que solo cuenta las filas vivas, así que sacar un mapa
y volver a bajarlo reusa la misma fila.

**Por qué existe.** El navegador puede borrar todo lo guardado del celular sin
avisar. Si la única anotación de qué mapas tenías viviera ahí, se iría con el
resto: al abrir con señal los datos vuelven solos, la pantalla se ve perfecta y
los mapas no están. Con esta tabla la app compara lo que la base dice que tenías
contra lo que quedó en el celular y avisa **en casa**. Ver la decisión 021.

**Permisos:** cada usuario ve, crea, edita y borra únicamente sus propias filas.
Nadie ve las de los demás, ni siquiera el administrador.

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
