# 044 — Dibujar el Circuito directamente, punto por punto

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto;
implementación pendiente

## Decisión

Para armar un Circuito, la persona marca con el mouse los puntos por donde
quiere ir. Puede empezar en cualquier lugar del mapa, con o sin un Camino
marcado. No hay una etapa obligatoria de seleccionar un Camino ni modos
separados para «usar Camino» y «dibujar parte propia».

Cuando dos puntos consecutivos del Circuito caen sobre un mismo Camino, la
línea entre ambos sigue la forma de ese Camino en lugar de unirlos en línea
recta. Si después se marca un punto fuera del Camino, el Circuito sale de él
y continúa hasta ese punto. Se puede continuar libremente o volver a seguir
un Camino con otros puntos.

El Circuito sigue siendo independiente del contenido de Mapas: crearlo o
editarlo no crea ni modifica Caminos, puntos o trazos. Si su línea utiliza un
Camino, mantiene el vínculo para seguir sus correcciones y avisar antes de
salir, según la decisión 042.

## Pendiente técnico y visual

Definir la tolerancia con que un toque se reconoce como «sobre un Camino» en
distintos acercamientos y qué pasa si dos Caminos se cruzan o se superponen.
Esto no cambia la interacción principal de un solo dibujo punto por punto.
El boceto revisado está en `docs/bocetos/circuitos-editor.html` y todavía no
está aprobado por Ale.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034 y 042, bocetos anteriores y corrección explícita de Ale en la conversación.
- **Decidido por Alejandro:** dibujo directo del Circuito con el mouse; puede empezar fuera de cualquier Camino; si los dos puntos caen sobre el mismo Camino, seguir su curso; al tocar fuera, salir de él; sin botones ni porcentajes para seleccionar Caminos.
- **Inferido:** el toque sobre Camino debe identificarse por cercanía geométrica sin convertir el Camino en requisito de creación.
- **Pendiente de verificación:** aprobación visual del boceto, detalles de cruces y comportamiento en la app real.
