# Encargo para Claude: diagnóstico de «Caminos» en TrackApp

Este texto se puede copiar completo en Claude. Es una **primera tarea
autónoma, de análisis y documentación**. La implementación se encargará con
otro texto cuando Alejandro haya decidido las cuestiones abiertas.

---

Trabajás en `C:\Users\Usuario\Desktop\TrackApp`, una app de navegación al
aire libre de Alejandro. Leé primero `AGENTS.md` y
`docs/planes/2026-10-05-mapas-caminos-circuitos.md`. Tu tarea es **diagnosticar
con precisión cómo trasladar las líneas explorables al módulo Mapas**. No
implementes ni publiques nada en esta etapa.

## Contexto de producto que no debés perder

Alejandro planifica en Google Earth, desde su casa, varias huellas posibles
para explorarlas en bicicleta. Una línea dibujada desde casa no garantiza que
se pueda pasar. Después de explorar, una parte puede ser transitable en
bicicleta, transitable solo caminando con la bicicleta, o imposible de pasar.
Con kayak puede haber una parte que exija salir del agua y llevarlo a pie.
Las alternativas, incluso las cerradas, deben quedar visibles para decidir en
el cerro. También importan puntos de referencia y trazos que representan
cosas del terreno, como un río o un alambrado.

La nueva separación conceptual decidida con Ale es:

- **Mapas:** fondo cartográfico, zonas, sectores, anotaciones y una futura capa
  para los caminos o pasos explorables. Cada parte de un camino tiene condición
  de paso y complejidad local.
- **Circuitos:** módulo futuro para planificar una salida escogiendo partes de
  caminos ya guardados. Dibujar el plan no crea caminos ni anotaciones.
- **Salidas:** módulo **ya existente** para contar o registrar lo que ocurrió
  realmente un día. No lo confundas con Circuitos.

El nombre «Caminos» es **provisional** porque también hay pasos de kayak. La
palabra final se decide con Ale. **Circuitos aún no existe** en código ni en la
base. Las pantallas y la tabla llamadas `rutas` son la implementación antigua:
mezclan la línea importada y los datos globales de una salida planificada. No
las rebautices por búsqueda y reemplazo.

Las cuatro condiciones de una parte son: `por_explorar`, `transitable`,
`a_pie` y `sin_paso`. La complejidad local es `facil`, `media`, `dificil` o
sin clasificar. Verde/amarillo/rojo representan solo complejidad; tipo de
línea y X representan condición. Una X no vuelve roja la parte. Los datos
globales de esfuerzo y dificultad técnica no determinan la complejidad local.

## Estado técnico real que tenés que verificar

1. Existe un módulo Rutas, respaldado por la tabla `rutas`, con alta GPX/KML,
   lista, ficha, edición y navegación. Revisá `app/(app)/rutas`,
   `components/rutas`, `app/actions/rutas.ts`, `lib/rutas`, `types/database.ts`
   y `docs/SCHEMA.md`.
2. Mapas y anotaciones ya existen. La importación de Google Earth en
   `lib/anotaciones` acepta puntos y líneas; no confundas esos trazos con
   caminos. Revisá `app/(app)/zonas`, `components/anotaciones`,
   `components/zonas` y `components/mapa`.
3. La navegación debe funcionar sin señal. Revisá `lib/offline`, las pantallas
   de `components/navegacion`, los puntos donde se descargan las líneas y cómo
   se informa una descarga incompleta.
4. Hay cambios **locales sin confirmar** para un prototipo de partes de Ruta:
   `lib/rutas/partes.ts`, `components/rutas/editor-de-partes.tsx`,
   `app/actions/partes-de-ruta.ts` y cambios relacionados. Inspeccioná
   `git status` antes de nada. Podés señalar lógica reutilizable, pero **no
   tomes su ubicación en Rutas ni su modelo de almacenamiento como decisión
   definitiva**. No descartes, reformatees ni sobrescribas esos cambios.
5. `docs/decisiones/033-partes-de-una-ruta.md` describe el prototipo anterior.
   La revisión conceptual posterior de Ale está explicada en el plan citado
   arriba. Señalá las contradicciones con `AGENTS.md` y el glosario; no las
   resuelvas silenciosamente.
6. El archivo compartido es
   `C:\Users\Usuario\Downloads\Ascochinga Bike 1.kml`. Leelo solo si está
   accesible. Se observaron siete líneas y ningún punto; comprobalo si podés.
   No lo importes a la base ni lo subas a ningún servicio.

## Tu alcance exacto ahora

Hacé un análisis técnico **solo del futuro lado Mapas/caminos**. Podés leer
archivos, ejecutar búsquedas y pruebas locales no destructivas. No cambies
código, base, datos reales, configuración, pantallas, documentación existente,
Git, despliegues ni credenciales. Tu único archivo nuevo permitido es
`docs/planes/auditoria-caminos-claude.md`, donde dejarás el informe. No hagas
commit ni push. Si necesitás una decisión de producto, formulá la pregunta y
detenete en ese punto; no la sustituyas por tu criterio.

El informe debe tener estas secciones, con referencias concretas a lo que
leíste:

1. **Qué hay hoy:** recorrido de una línea desde KML/GPX hasta base, paquete
   offline, mapa y navegación. Identificá las pantallas y funciones
   involucradas. Separá código ya confirmado de prototipo local.
2. **Qué se puede reutilizar:** geometría, partición de líneas, importación,
   estilos y editor; qué debe moverse, adaptarse o rehacerse y por qué.
3. **Modelo de datos propuesto, sin aplicarlo:** una o dos alternativas para
   almacenar caminos y partes, con ventajas, riesgos y relación prevista con
   circuitos. Especificá cómo una parte conserva identidad para que varios
   circuitos puedan referenciarla y qué sucede si se vuelve a dividir. No
   inventes permisos: listá las decisiones faltantes.
4. **KML y puntos:** cómo ofrecer cada línea como alternativa individual sin
   convertir siete líneas en un único recorrido; cómo evitar duplicar líneas
   como anotaciones cuando el archivo también tiene marcadores.
5. **Offline y seguridad:** cambios que harían falta en sincronización,
   descarga, navegación, avisos antes de salir y pruebas en modo avión. La
   navegación nunca debe pedir internet. Incluí RLS, permisos SQL,
   `eliminado_en`, `creado_en` y `actualizado_en` para cualquier tabla
   propuesta, siguiendo `AGENTS.md`.
6. **Preguntas para Alejandro:** solo las que bloquean decisiones reales, en
   lenguaje sencillo y agrupadas para no abrumarlo. Separá las que necesita
   contestar antes de programar de las que pueden esperar.
7. **Plan de implementación de tu módulo:** pasos pequeños, archivos o áreas
   que tocarías, criterios de aceptación y puntos de integración reservados a
   Codex. Indicá explícitamente lo que **no** tocarías: Circuitos, Salidas,
   publicación y los archivos compartidos hasta acordar el contrato.

Terminá con **Auditoría de fuentes**: leído en tiempo real, inferido y
pendiente de verificación. No uses filas viejas de la base como ejemplo. No
presentes una propuesta como decisión de Ale. Si detectás que un documento
contradice el código o la base, informalo con la regla de
`docs/MANTENIMIENTO.md`.

## Coordinación con Codex y condición de cierre

Mientras vos auditás Mapas/caminos, Codex prepara el diseño de Circuitos y
las decisiones comunes. Ambos trabajos se combinarán **después** de que Ale
apruebe vocabulario, permisos, relación entre caminos y circuitos, y bocetos
de las pantallas nuevas. Tu informe debe permitir redactar un segundo encargo
de implementación sin ambigüedades. Al terminar el informe, **detenete**:
no pases a programar por tu cuenta ni interpretes el silencio de Ale como
aprobación.

---

## Auditoría de fuentes de este encargo

- **Leído en tiempo real:** conversación con Ale; `AGENTS.md` de la sesión;
  estado de Git; archivos y documentos enumerados en el plan de separación.
- **Inferido:** comenzar por un diagnóstico de solo lectura permite trabajar
  en paralelo sin pisar los cambios locales ni fijar un esquema prematuro.
- **Pendiente de verificación:** las decisiones de producto listadas en el
  plan; el resultado de la auditoría independiente de Claude.
