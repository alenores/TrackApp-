# 038 — Observación y fecha compartidas por cada parte

**Decidido por Alejandro:** 2026-10-06 · **Estado:** lógica local; guardado y pantalla pendientes

## Decisión

Cada parte de un Camino tiene **una sola observación y una sola fecha de
comprobación**. Esos dos datos se comparten entre todas las actividades de esa
parte. En cambio, la condición de paso y la complejidad se indican por
actividad, conforme a la decisión 036.

La fecha de comprobación indica cuándo se comprobó esa parte en el terreno:
**no puede ser posterior al día de hoy**. Alejandro lo confirmó el 2026-10-06.

Cambiar la observación o la fecha no cambia la línea ni la clasificación de
ninguna actividad. Partir una parte copia esos datos a las partes resultantes;
corregir el dibujo los conserva en las partes que siguen en la línea, conforme
a la decisión 037.

## Estado de implementación

La lógica local de Caminos ya representa y conserva esos datos. Todavía no
existen el editor definitivo, el guardado en la base ni la navegación de
Caminos con este modelo.

## Auditoría de fuentes

- **Leído en tiempo real:** lógica de partes en `lib/caminos/partes.ts` y
  decisiones 036 y 037.
- **Decidido por Alejandro:** una observación y una fecha de comprobación por
  parte, compartidas entre actividades, y fecha nunca futura.
- **Pendiente de verificación:** editor, persistencia y visualización en mapa.
