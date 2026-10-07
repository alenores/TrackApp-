# Encargo para Claude — contrato técnico de Circuitos

**Fecha:** 2026-10-07

**Responsable:** Claude

**Etapa:** estudio técnico paralelo a la prueba de Mapas/Caminos y al diseño del editor de Circuitos por Codex.

**Entrega única:** `docs/planes/informe-tecnico-circuitos-claude-2026-10-07.md`.

## Propósito y contexto de uso

Alejandro planifica salidas desde su computadora. En Google Earth marca varias
posibilidades; luego en el terreno descubre cuáles sirven, cuáles exigen ir a
pie con el equipo y cuáles no tienen paso. **Caminos** son esas alternativas
marcadas en Mapas. Sus partes tienen clasificación propia, por actividad. Un
**Circuito** es un plan de salida que se puede dibujar sobre el mapa, incorporar
porciones de Caminos existentes sin volver a trazarlas o combinar ambas cosas.
**Salidas** documenta lo que realmente ocurrió. Son tres conceptos distintos.

El módulo nuevo de Mapas/Caminos ya se publicó y Alejandro empezó a probarlo
con `Ascochinga Bike 1.kml`: aparecen siete líneas y ningún punto. Aún faltan
pruebas de guardado y edición completas, permisos con las tres categorías y
modo avión. **Circuitos todavía no existe** como módulo, tabla ni editor. La
pantalla vieja llamada **Rutas** mezcla un recorrido importado con los datos
globales de un plan. Su implementación y las filas antiguas de la base no son
un modelo aprobado ni datos a migrar. En el árbol de trabajo también hay un
prototipo local de «partes de ruta» sin confirmar; no lo modifiques ni lo
consideres una decisión de producto.

## Decisiones de Alejandro que el informe debe respetar

1. Mapas muestra Caminos, puntos y trazos de referencia. Los Caminos son
   alternativas, no promesas de paso. Sus partes pueden estar por explorar,
   transitables, exigir ir a pie con equipo o estar sin paso. Un tramo sin paso
   sigue visible. La complejidad local y la condición de paso pueden diferir
   según la actividad. Esos datos no se confunden con el esfuerzo o la
   dificultad técnica global del futuro Circuito.
2. Circuitos planifica una salida. Puede usar solo partes de Caminos, solo
   segmentos dibujados para ese Circuito —incluso sobre vías evidentes del
   mapa de fondo— o una mezcla. Puntos y trazos son referencias visuales,
   nunca piezas obligatorias. Crear o editar Circuitos no modifica Caminos,
   puntos ni trazos.
3. La parte de un Circuito tomada de un Camino **permanece vinculada**. Si se
   corrige el dibujo del Camino, el Circuito sigue la línea corregida y la app
   avisa **antes de salir**, con señal. Esa corrección del dibujo no cambia por
   sí sola la condición, complejidad, observación ni fecha de las partes del
   Camino. Ver decisiones 037 y 042.
4. Se puede guardar un Circuito con partes separadas sin dibujar el enlace.
   Debe mostrarse un aviso de **plan incompleto**, también antes de salir.
   Ninguna línea inventada puede simular la conexión. Ver decisión 043.
5. Administrador y Premium pueden crear Circuitos. Premium edita los propios;
   Administrador edita todos; Normal solo los consulta. Ver `docs/USUARIOS.md`.
6. Zonas y Sectores solo fragmentan descargas de mapas. No poseen ni delimitan
   Caminos o Circuitos. Antes de salir, el plan permite saber qué mapas bajar.
7. En la navegación no hay solicitudes a internet. Toda geometría, mapa y dato
   necesario se prepara con señal; faltantes y cambios relevantes se informan
   antes de salir. El GPS envejecido y las fallas se muestran, no se ocultan.

## Hechos técnicos para verificar contra el código actual

- `caminos` guarda geometría, partes y `version_forma`; corregir la geometría
  aumenta esa versión. Revisá `scripts/supabase-caminos.sql`,
  `lib/caminos/datos.ts`, `lib/caminos/guardado.ts`,
  `lib/caminos/geometria.ts`, `lib/caminos/partes.ts`,
  `app/actions/caminos.ts` y `types/database.ts`. No supongas nombres de
  columnas: verificá el esquema o la migración, sin leer filas reales.
- La descarga actual combina un paquete liviano y geometrías pesadas. Mirá
  `lib/offline/paquete.ts`, `lib/offline/sincronizacion.ts`,
  `lib/offline/lineas-de-caminos.ts`, `lib/offline/recorridos.ts`,
  `lib/offline/calentar.ts` y la navegación actual. El informe debe localizar
  el punto en que se detectan cambios para avisar con señal, y cómo dejar
  preparada una versión coherente del Circuito sin consultas durante la salida.
- La app vieja usa `rutas`; `salidas.ruta_id` existe. Revisá el esquema,
  `types/database.ts`, las acciones y las pantallas relacionadas para medir
  el impacto de separar conceptos. No propongas una migración de filas viejas
  por defecto ni cambies Salidas sin una decisión expresa.
- Hay dependencias de visualización en `components/mapa/mapa.tsx`,
  `components/navegacion`, `components/rutas`, `components/zonas` y
  `components/caminos`. Localizá las dependencias reales mediante búsqueda;
  esta lista es un punto de partida, no una lista completa.

## Trabajo concreto

Leé `AGENTS.md`, el plan `docs/planes/2026-10-05-mapas-caminos-circuitos.md`,
`docs/decisiones/034-circuitos-combinan-caminos-y-dibujo.md`, las decisiones
035-043, `docs/USUARIOS.md`, `docs/ARQUITECTURA.md`, `docs/SCHEMA.md` y el
glosario. Después inspeccioná el código relevante **solo en lectura**.

Escribí un informe técnico que incluya:

1. **Inventario comprobado:** dónde viven hoy Rutas, Caminos, Salidas,
   permisos, mapa general, navegación, descarga y datos locales; qué cambios
   serían necesarios para introducir Circuitos sin interferir con la prueba
   actual de Caminos. Separá lo comprobado en código de lo que solo dice un
   documento y señalá contradicciones.
2. **Modelo de datos propuesto**, con dos o tres alternativas cuando exista un
   intercambio importante. Explicá cómo representar en orden segmentos
   propios y segmentos vinculados a un intervalo de un Camino, su dirección y
   su posible repetición. Indicá cómo evitar que volver a clasificar partes
   del Camino rompa el vínculo. No confundas límites de clasificación con
   extremos elegidos para el Circuito.
3. **Corrección de un Camino:** describí cómo mantener la porción que el
   Circuito eligió cuando cambian el largo o los puntos del Camino. Compará
   alternativas de anclaje; incluí ejemplos de cambio simple, inserción de
   puntos, desvío grande, extremos movidos y ambigüedad imposible de resolver
   con certeza. La regla de producto es seguir la corrección y avisar; si un
   caso exige revisión humana, proponé cómo comunicarlo sin cambiar esa regla
   silenciosamente.
4. **Integridad del plan:** cómo detectar partes separadas y mostrar el aviso
   sin bloquear el guardado ni completar huecos automáticamente. Separá el
   estado de un plan incompleto de la condición «sin paso» de un Camino.
   Describí las preguntas que aún requieren decisión sobre Caminos retirados,
   clasificaciones que cambian, orden, repetición y relación con Salidas.
5. **Preparación sin señal:** qué se guarda, cómo se actualiza cuando cambia un
   Camino, cómo se sabe antes de salir si un Circuito quedó desactualizado y
   cómo se evita mezclar versiones de geometría. Incluí los avisos de mapas
   faltantes y plan incompleto. Navegar jamás hace pedidos de red.
6. **Permisos y seguridad:** propuesta de tablas y controles por fila, con
   borrado lógico, `creado_en`, `actualizado_en`, RLS y permisos SQL explícitos
   desde el comienzo. Tratá la concurrencia de ediciones y la invalidez de
   referencias a Caminos retirados. No ejecutes SQL.
7. **Secuencia de implementación en pasos chicos**, con archivos o módulos que
   tocaría cada paso, pruebas automáticas para la lógica crítica, revisión
   visual sol/noche, prueba real en modo avión y puntos que deben esperar un
   boceto aprobado por Alejandro. Proponé cómo aislar el trabajo de Claude del
   de Codex para evitar editar los mismos archivos a la vez.
8. **Preguntas mínimas para Alejandro:** solo decisiones de producto que no
   puedan deducirse de las fuentes. Formulalas en lenguaje simple, de a una
   línea, con opciones concretas. No conviertas propuestas técnicas en
   decisiones atribuidas a él.

En el informe marcá cada afirmación importante como **verificada**, **propuesta**
o **pendiente de Ale**. Terminá con `## Auditoría de fuentes` siguiendo
`docs/MANTENIMIENTO.md`.

## Límites estrictos de este encargo

- Podés crear o editar **únicamente** el archivo de entrega indicado arriba.
- No cambies código, migraciones, base, datos reales, documentos existentes,
  configuración, pruebas ni pantallas. No hagas commit, push ni despliegue.
- No leas filas de la base: las existentes son restos de la app vieja. Para
  nombres y restricciones usá esquema y migraciones.
- No implementes Circuitos ni renombres Rutas en esta etapa. Falta aprobar el
  boceto visual y decidir varios comportamientos. No uses el prototipo local
  de partes de ruta como diseño obligatorio.
- No le pidas a Alejandro que resuelva aspectos técnicos. Entregá propuestas
  técnicas razonadas y reservá las preguntas para decisiones de uso.

## Criterio de entrega

El informe debe permitir que otra persona empiece la primera fase de Circuitos
sin reinterpretar la conversación. Si una decisión falta, debe quedar visible
con su consecuencia; nada se da por aprobado por silencio. Al terminar,
respondé a Alejandro en pocas líneas: qué verificaste, qué propusiste, cuáles
son las decisiones pendientes y confirmá que solo creaste el informe.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034, 035, 036, 037, 042 y 043; plan de separación, esquema documentado, permisos, estado de Git, migración y código de Caminos y descarga.
- **Inferido:** una auditoría con contrato técnico es la primera tarea paralela segura porque el editor de Circuitos y sus reglas pendientes todavía necesitan definición y boceto aprobados.
- **Pendiente de verificación:** conclusiones técnicas de Claude, decisiones abiertas y funcionamiento real de Circuitos una vez implementado.
