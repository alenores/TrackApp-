# 046 — Un Circuito distingue sus partes propias de los Caminos que usa

**Decidido por Alejandro:** 2026-10-07 · **Estado:** regla definida; dibujo en el mapa preparado, editor y guardado pendientes

## Dibujo

La parte marcada libremente para un Circuito es una línea continua neutra:
negra en modo sol y blanca en modo noche. No lleva los colores verde, amarillo
o rojo ni las marcas de exploración o de paso de los Caminos. Dibujarla no
significa que falte explorarla: puede ser una calle evidente o un lugar que
quien arma el Circuito ya conoce.

Una parte tomada de un Camino conserva el color de la complejidad de ese
Camino y su marca correspondiente: entrecortada si está por explorar,
continua si se confirmó el paso, punteada si se avanza a pie con el equipo y
con X si no se puede pasar. El Circuito no cambia esa información en Mapas.

## Actividades mientras se arma

Cada Circuito se arma para una actividad. Un Camino puede tener una o más
actividades, con una clasificación distinta en cada una. Quien arma el
Circuito puede elegir una o varias actividades cuyos Caminos quiere ver en
el mapa. Al pasar el mouse por un Camino, se muestran todas sus actividades.

Si la actividad del Circuito está entre las que se muestran y el Camino la
incluye, se ve la clasificación de esa actividad. Si el Camino corresponde
solo a otra actividad elegida, sigue visible más tenue y se ve su
clasificación para esa otra actividad. Incorporarlo al Circuito conserva con
qué actividad se lo tomó; apagar luego ese filtro no transforma el tramo en
uno confirmado para la actividad del Circuito.

## Estado de implementación

El mapa compartido y la lógica de dibujo ya aceptan y distinguen ambas clases
de partes. Todavía falta conectarlos a una pantalla de Circuitos con guardado
y navegación. Esta decisión no presenta esa preparación como una función ya
disponible para los usuarios.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034, 036 y 044; clasificación y dibujo de Caminos; mapa compartido de la app; intercambio de Alejandro del 2026-10-07.
- **Decidido por Alejandro:** actividad obligatoria en cada Circuito; filtro de una o varias actividades de Caminos; mostrar todas las actividades al pasar el mouse; partes propias neutras y continuas; partes de Caminos con su información visible.
- **Inferido:** mostrar más tenue el Camino de otra actividad, según el acuerdo anterior sobre actividad principal; conservar la actividad elegida al incorporarlo evita cambiar el significado del Circuito al mover un filtro.
- **Pendiente de verificación:** editor integrado, guardado, prueba visual en ambos modos y navegación.
