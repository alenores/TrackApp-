# 047 — Resumen permanente de cada Circuito

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; cálculo y presentación preparados, integración pendiente

## Decisión

El detalle de todo Circuito muestra siempre, debajo del mapa, un resumen escrito. No aparece un modal ni un cartel superpuesto cada vez que cambia un Camino. El resumen se recalcula con la información vigente de los Caminos incorporados y corresponde a la actividad elegida para el Circuito.

El resumen distingue cuánto se dibujó solo para el Circuito y cuánto sigue Caminos, sin asignar a lo primero un estado de exploración. Informa por separado qué partes de Caminos están por explorar, cuáles permiten avanzar montado, cuáles requieren caminar con el equipo y cuáles no tienen paso. Indica cuántos tramos y qué longitud corresponden a cada caso, y la proporción verde, amarilla y roja de complejidad. Rojo no significa «sin paso»: eso lo indican las X.

También deja a la vista los Caminos tomados para otra actividad, los Caminos retirados de Mapas que siguen integrando el Circuito y las partes sin unir. Estas consideraciones se leen en el detalle antes de salir; no se esconden detrás de un botón. La línea del mapa conserva su diferenciación visual.

Las decisiones 042, 043 y 045 mantienen el comportamiento del Circuito y sus Caminos. Esta decisión reemplaza únicamente la forma de presentar sus avisos: pasan al resumen permanente.

## Estado de implementación

La función que calcula el resumen y la pieza visual están preparadas y probadas en aislamiento. Circuitos todavía no tiene pantalla de detalle, guardado ni navegación; por eso el resumen aún no es visible en la app.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034, 042, 043, 045 y 046; lógica actual de Caminos y Circuitos; glosario y reglas de diseño.
- **Decidido por Alejandro:** resumen siempre visible, actualizado con los Caminos y sin modales ni carteles superpuestos por cambios.
- **Inferido:** las proporciones usan como base el largo total del Circuito; se indica expresamente en pantalla para evitar interpretaciones distintas.
- **Pendiente de verificación:** integración en la futura pantalla de detalle, actualización de datos descargados y prueba completa con un Circuito guardado.
