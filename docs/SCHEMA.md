# Esquema de la base de datos — TrackApp

> Leído en tiempo real el 2026-09-18, directo de la base.
> **Esta es la fuente de verdad para nombres de tablas y columnas.**
> Si el código dice otra cosa, manda esto.

⚠️ **No confundir con la base de Vías de Escalada Córdoba.** Son dos proyectos
Supabase distintos. La de TrackApp tiene `rutas`, `sectores`, `zonas`,
`profiles`, `novedades` y `descargas`. Si aparecen `vias`, `aperturistas` o
`sector` en singular, es la otra base: frenar.

---

## rutas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, se genera sola |
| `user_id` | uuid | FK a los usuarios. **Acepta vacío** (ver riesgos) |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `distancia_km` | double precision | |
| `gpx_url` | text | |
| `geojson` | jsonb | obligatorio |
| `bbox` | jsonb | obligatorio |
| `created_at` | timestamptz | |
| `subido_por_nombre` | text | |
| `actividades` | text[] | obligatorio, arranca vacío |

**Restricción sobre `actividades`:** solo admite estos siete valores —
`trekking`, `correr`, `mountain_bike`, `moto`, `camioneta`, `canyoning`, `kayak`.

**Permisos:** cualquiera ve todas. Solo el creador inserta, edita y borra.

**No existen todavía:** desnivel positivo, desnivel negativo, dificultad
técnica, nivel de esfuerzo, equipo, complicaciones. Son columnas nuevas.

---

## zonas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | obligatorio |
| `provincia` | text | obligatorio |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `subido_por_nombre` | text | |
| `created_at` | timestamptz | |

**No tiene coordenadas.** El rectángulo de dos puntos definido en la decisión
011 es una columna nueva.

**Permisos:** solo usuarios con sesión ven las zonas. Solo el creador edita y
borra.

---

## sectores

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `zona_id` | uuid | obligatorio, FK a zonas |
| `user_id` | uuid | obligatorio |
| `nombre` | text | obligatorio |
| `descripcion` | text | |
| `lat_ne` `lon_ne` | double | esquina noreste |
| `lat_se` `lon_se` | double | esquina sudeste |
| `lat_so` `lon_so` | double | esquina sudoeste |
| `lat_no` `lon_no` | double | esquina noroeste |
| `zoom_minimo` | integer | por defecto 12, mínimo 10 |
| `subido_por_nombre` | text | |
| `created_at` | timestamptz | |

**Guarda las cuatro esquinas (ocho números).** La decisión 011 lo cambia a dos
puntos: es una migración real, no un ajuste.

**Permisos:** solo usuarios con sesión ven los sectores. Solo el creador edita y
borra. **Todavía no refleja que crear sectores es tarea exclusiva del
administrador** (decisión 009).

---

## profiles

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, es el mismo id del usuario |
| `nombre` | text | |
| `avatar_url` | text | |
| `updated_at` | timestamptz | obligatorio |

**Permisos:** todos ven todos los perfiles. Cada uno edita el suyo.

---

## novedades

| Columna | Tipo | Notas |
|---|---|---|
| `id` | integer | PK autoincremental |
| `descripcion` | text | obligatorio |
| `created_at` | timestamptz | |

**Permisos:** todos leen. **Cualquiera con sesión puede insertar cualquier
cosa** (ver riesgos).

---

## descargas

| Columna | Tipo | Notas |
|---|---|---|
| `id` | integer | PK autoincremental |
| `user_id` | uuid | |
| `ruta_id` | uuid | FK a rutas |
| `created_at` | timestamptz | |

Un registro único por usuario y ruta. **El código de la app nunca la consulta:
está sin uso** (ver riesgos).

---

## Depósitos de archivos

| Depósito | Público | Límite de tamaño | Tipos permitidos |
|---|---|---|---|
| `avatars` | sí | **ninguno** | **ninguno** |
| `gpx-files` | sí | **ninguno** | **ninguno** |

Ver riesgos.

---

## Estado frente a las convenciones fijas

| Convención | ¿Se cumple? |
|---|---|
| Nombres en snake_case español | **No.** `created_at`, `updated_at`, `user_id` |
| `id` serial autoincremental | **No.** Las cuatro tablas principales usan uuid |
| Borrado lógico (`eliminado_en`) | **No.** Ninguna tabla lo tiene. El borrado es definitivo |
| `creado_en` / `actualizado_en` | **No.** Están en inglés, y falta el de modificación en casi todas |
| RLS activo | **Sí**, en las seis tablas |

---

## Auditoría de fuentes

**Leído en tiempo real (2026-09-18):** el esquema completo de la base de
TrackApp —tablas, columnas, tipos, restricciones y políticas de seguridad— y la
lista de depósitos de archivos, obtenidos ejecutando consultas directas contra
la base.

**Pendiente de verificación:** nada. Este documento está verificado.
