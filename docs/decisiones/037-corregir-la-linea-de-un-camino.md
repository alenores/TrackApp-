# 037 — Corregir la línea de un Camino existente

**Decidido por Alejandro:** 2026-10-05; aclarado el 2026-10-06 · **Estado:** lógica local en revisión; integración pendiente

## Decisión

Si la línea de un Camino quedó mal dibujada, el usuario autorizado puede
corregirla dentro de la app **sin crear otro Camino**. La corrección modifica
el mismo Camino; su identidad y la información ya asociada no se pierden por
el mero hecho de ajustar el dibujo.

Se aplica la regla de permisos aprobada para el contenido del mapa: Premium
edita los Caminos propios y el Administrador puede editar todos.

## Clasificaciones al corregir

**Corregir el dibujo solo cambia el dibujo.** Todas las partes que continúan
en la línea conservan su condición de paso y su complejidad por actividad,
incluida la parte cuya forma cambió. Si estaba «por explorar», sigue así. Si
ya estaba clasificada, conserva esa clasificación. No aparece una marca de
revisión ni se exige volver a clasificar por corregir la geometría: Alejandro
aclaró que muchas correcciones de la línea provienen precisamente de haberla
relevado en el monte.

Si cambia el largo de la línea, los límites entre partes se adaptan al nuevo
dibujo conservando el orden de las partes y sus datos. Si se elimina por
completo el fragmento de línea que ocupaba una parte, esa parte deja de tener
un lugar donde mostrarse.

**La clasificación también se puede editar sin tocar la línea.** Cambiar la
condición de paso o la complejidad de una parte no exige corregir su geometría.
Estas ediciones son independientes entre sí.

## Estado de implementación

La app actual todavía no implementa el modelo definitivo de Caminos. La lógica
local de la primera etapa se corrigió para respetar esta aclaración; las
pantallas y la base siguen pendientes.

## Auditoría de fuentes

- **Leído en tiempo real:** plan de Mapas/Caminos/Circuitos y decisión 036.
- **Decidido por Alejandro:** se puede corregir la línea del mismo Camino en
  la app sin cargar otro. Corregir la línea conserva las clasificaciones de
  todas las partes que continúan; condición y complejidad se pueden modificar
  por separado aunque la línea quede igual.
- **Pendiente de verificación:** editor, persistencia e integración sin señal.
