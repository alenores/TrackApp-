# 048 — Conservar el lugar donde termina el Circuito

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; implementación pendiente

## Decisión

Si un Circuito termina justo en la punta de un Camino y más tarde se alarga o
acorta esa punta al corregir el Camino, el Circuito conserva el lugar donde
terminaba. No extiende ni retrae automáticamente su final hasta la punta nueva.

El resto de la parte tomada del Camino sigue la línea corregida, según la
decisión 042. Si al acortarse el Camino deja de alcanzar el final conservado,
la app no inventa una línea para unir ambos lugares: el detalle muestra la
separación en el mapa y en el resumen permanente como «Partes sin unir», según
las decisiones 043 y 047. El final marcado por la persona permanece visible.

Esta regla responde la pregunta 5 del informe técnico de Circuitos. Solo
define el final del Circuito en este caso; no cambia cómo se corrige o
clasifica el Camino.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 042, 043, 044 y 047; pregunta 5 del informe técnico de Circuitos; lógica actual de dibujo y corrección de Caminos.
- **Decidido por Alejandro:** conservar el lugar anterior del final del Circuito cuando se corrige la punta del Camino.
- **Inferido:** si la línea corregida ya no llega a ese lugar, no se dibuja una unión inexistente; se aplica la regla ya aprobada de partes sin unir.
- **Pendiente de verificación:** guardado del punto final, traslado de los demás puntos al corregir el Camino e integración en la futura pantalla de Circuitos.
