# Encargo para Claude — primera implementación aislada de Caminos

> **Aclaración posterior de Alejandro (2026-10-06):** el requisito de marcar
> una parte corregida para revisión quedó sin efecto. Corregir el dibujo
> conserva la condición y complejidad de las partes que siguen en la línea,
> incluida la parte redibujada. Ver decisión 037. Este encargo ya fue
> ejecutado; esta nota evita volver a aplicar su regla anterior.
> Alejandro también decidió después que cada parte tiene una observación y
> fecha de comprobación compartidas entre sus actividades (decisión 038).

**Estado:** listo para copiar a Claude. Esta etapa implementa únicamente la
lógica de lectura de archivos y de clasificación de Caminos. No agrega aún
pantallas, tablas ni navegación.

Trabajás en `C:\Users\Usuario\Desktop\TrackApp`. Alejandro es dueño del
producto. Leé antes de tocar código `AGENTS.md`, el plan
`docs/planes/2026-10-05-mapas-caminos-circuitos.md`, las decisiones 033 a 037
de `docs/decisiones/` y tu diagnóstico
`docs/planes/auditoria-caminos-claude.md`. **Las decisiones nuevas prevalecen
sobre las propuestas del diagnóstico y sobre el encargo de diagnóstico viejo.**
Inspeccioná `git status` al empezar: hay un prototipo local sin confirmar que
no debés borrar, sobrescribir, reformatear ni publicar.

## Objetivo concreto de esta etapa

Implementá en `lib/caminos/` dos piezas puras, sin interfaz ni base de datos:

1. Un lector para `.kml`, `.kmz` y `.gpx` que devuelva por separado cada línea,
   cada punto y cada elemento omitido con su motivo. Aprovechá las funciones
   actuales de `lib/rutas/archivo.ts` y
   `lib/anotaciones/archivo-de-google-earth.ts` sin editarlas. Conservá nombre,
   descripción, orden, coordenadas y color de origen como datos de vista
   previa. `MultiLineString`/`MultiGeometry` debe entregar cada línea por
   separado. Nunca sumar las siete líneas de Ascochinga como una sola ruta.
   El lector **no decide** por el color si una línea será Camino o Trazo: esa
   elección ocurrirá línea por línea en la futura pantalla de importación.
2. Un modelo y funciones puras para dividir y clasificar la línea de un
   Camino. Cada Camino tiene al menos una actividad y puede tener varias. La
   lista existente es: Trekking, Correr, Mountain bike, Kayak y Canyoning;
   reutilizá sus identificadores actuales. Cada parte guarda condición de
   paso y complejidad **por actividad**. Las cuatro condiciones son
   `por_explorar`, `transitable`, `a_pie`, `sin_paso`; la complejidad local es
   `facil`, `media`, `dificil` o sin clasificar. Una línea recién importada
   empieza por explorar y sin complejidad clasificada en cada actividad
   elegida. Debe poder partirse entre dos posiciones, reclasificarse sin
   cambiar la línea y corregir su geometría sin convertirla en otro Camino.
   Si se corrige la línea, conservá las clasificaciones de todas las partes
   que siguen en ella, incluida la parte redibujada. No la reinicies ni la
   marques para revisión. No inventes zonas o sectores como pertenencia de
   un Camino.

La futura pantalla de Mapas y la navegación libre mostrarán todos los
Caminos. Cada persona elegirá una actividad principal y la app recordará su
última elección; los Caminos de otras actividades quedarán visibles pero con
menor protagonismo. **Esto es contexto de producto, no trabajo de interfaz en
esta etapa.** Circuitos se desarrollará después; podrá incorporar partes de
Caminos sin redibujarlas y agregar partes dibujadas solo para el Circuito.
No implementes Circuitos ni conviertas `rutas`.

## Archivos que podés modificar

- Crear o editar archivos bajo `lib/caminos/`, incluidas pruebas ahí mismo.
- Si necesitás otro archivo para completar esta etapa, explicá exactamente
  cuál y por qué en el informe final; no lo edites en esta tanda.

No edites `AGENTS.md`, documentos, `types/database.ts`, `lib/rutas/`,
`lib/anotaciones/`, `components/`, `app/`, `hooks/`, `scripts/` ni archivos de
sincronización. No cambies la base, los datos reales, los permisos, Git, ni
publicaciones. No hagas commit ni push. Podés **leer** todo lo necesario,
incluido el KML de Ascochinga en `C:\Users\Usuario\Downloads\Ascochinga Bike 1.kml`.
No lo copies al repositorio ni lo subas a ningún servicio.

## Pruebas necesarias

- KML con siete líneas produce siete candidatos separados y ningún punto.
  Usá una muestra inventada equivalente para la prueba automática; verificá
  el archivo real solo de forma local y de lectura si está accesible.
- `MultiGeometry` con varias líneas y puntos conserva cada objeto y sus datos.
- GPX y KMZ devuelven líneas y puntos por separado; los elementos omitidos
  llevan un motivo comprensible.
- Una parte recién importada cubre toda la línea con `por_explorar` y sin
  complejidad para cada actividad seleccionada.
- Partir y volver a partir no deja huecos ni superposiciones.
- Cambiar condición o complejidad para una actividad no modifica otra ni
  cambia la geometría.
- Corregir parte de la geometría conserva los datos de todas las partes que
  siguen en la línea, también los de la parte redibujada.
- No hay dependencia de `zona_id` ni `sector_id` en el modelo de Camino.

Ejecutá las pruebas de los módulos nuevos, `npx tsc --noEmit` y
`npm run lint`. Si falla algo ajeno a `lib/caminos/`, informá la falla sin
modificar archivos fuera del alcance. No declares la etapa terminada si las
pruebas críticas de tus piezas no pasan.

## Entrega

Al terminar, respondé en español claro: qué implementaste, qué probaste con
resultado exacto, qué quedó pendiente para la siguiente etapa y la lista
precisa de archivos nuevos. **Detenete ahí**. No avances a UI, base u offline
sin un nuevo encargo. Codex revisará e integrará esta pieza con las demás.
