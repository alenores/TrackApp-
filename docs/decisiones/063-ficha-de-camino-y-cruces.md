# 063 — Ficha de Camino y cruces de sin paso

**Fecha:** 2026-10-17 · **Decidió:** Ale

## La decisión

Al tocar un Camino se abre **la misma ficha** en Consultas, en la navegación
libre y al navegar un Circuito. Arriba dice **Consulta Camino**. El nombre del
Camino va abajo, con el resto de los datos: cada uno aparte, con su nombre y
su valor, para que no se lean como un texto corrido.

Las X de una parte sin paso **se achican al alejarse del mapa**, como los
íconos de los puntos. Las que se pisarían no se dibujan. De lejos no tienen
que formar una mancha negra sobre la línea.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.
- La ficha que ya compartían Consultas y la navegación libre.
- Las X de sin paso, dibujadas a un tamaño fijo.

### Inferido

- En la navegación de un Circuito la ficha no existía. Ale pidió unificarla,
  así que al tocar un tramo que sale de un Camino se abre la misma.

### Pendiente de verificación

- Mirarlo en el mapa: de lejos las X no se amontonan, y al acercarse crecen.
- Abrir la ficha en Consultas, en la navegación libre y en un Circuito.
