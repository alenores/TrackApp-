# Arquitectura de TrackApp

> Última revisión: 2026-09-17
> Estado: 🟡 ESQUELETO — se completa a medida que se refactoriza cada módulo

## Stack

Next.js · TypeScript · Tailwind · Supabase · Vercel · App web instalable (PWA).
Es el stack fijo de Ale, sin desvíos.

## Módulos

| Módulo | Estado | Documentado |
|---|---|---|
| Autenticación y perfiles | existe, sin revisar | ⬜ |
| rutas (alta, listado, detalle) | existe, sin revisar | ⬜ |
| Navegación con GPS | existe, analizado | 🟡 parcial, abajo |
| Zonas y sectores | existe, sin revisar | ⬜ |
| Offline y descargas | existe, analizado | 🟡 ver `decisiones/003` |
| Diseño e interfaz | a rehacer | ✅ `DISENO_EXTERIOR.md` |

## Mapas y navegación — estado al 2026-09-17

**Un solo proveedor de mapa:** OpenStreetMap, imágenes planas. No hay vista
satelital ni de relieve, y nunca la hubo (verificado contra todo el historial
del proyecto).

**Dos mapas distintos:**

- **Mapa de vista** — en el detalle de la ruta y en la vista previa al subir un
  recorrido. Dibuja la línea del recorrido. Sin GPS. **No lee lo descargado**
  (ver `RIESGOS.md` R3).
- **Mapa de navegación** — sigue la posición con GPS, calcula la distancia a la
  línea del recorrido y alerta al superar 50 metros de desvío. Sí lee lo
  descargado.

**Descarga offline:**

- rutas: niveles de acercamiento fijos, sin elección del usuario.
- Sectores: el usuario elige desde qué nivel de detalle descargar. Estima el peso
  y pide confirmación si la descarga es grande.
- Cada nivel de acercamiento adicional multiplica por cuatro la cantidad de
  imágenes. Ahí está todo el peso.

**«Mapa básico» vs «mapa completo»:** no son dos mapas distintos, es si las
imágenes están descargadas o no. Sin descargar, se ve la línea del recorrido
sobre fondo vacío.

## Pendiente de documentar

- Estructura de carpetas y separación de capas
- Autenticación y manejo de sesión
- Sincronización de datos
- Esquema de la base (`SCHEMA.md`)

## Auditoría de fuentes

**Leído en tiempo real (2026-09-17):** código de mapas, navegación, descarga
offline, componentes de rutas y zonas, configuración del proyecto, tipos de la
base, e historial completo del repositorio.

**Pendiente de verificación:** el esquema real de la base de datos. La base de
TrackApp no fue accesible en esa sesión. Todo lo referido a columnas sale del
código, no de la base.
