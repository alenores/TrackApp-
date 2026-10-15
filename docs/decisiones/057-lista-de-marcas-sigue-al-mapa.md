# 057 — La lista de Marcas sigue al mapa

**Fecha:** 2026-10-15 · **Decidió:** Ale

## La decisión

En Marcas, la lista muestra solo lo que entra en el pedazo de mapa que se está
mirando. Consultas no cambia.

- Con el mapa alejado, la lista es larga. Al acercarse, se achica. Al moverse
  a otro lugar, cambia a lo que quedó ahí.
- Si algo asoma apenas —una punta de zona, un Camino que cruza el borde—
  sigue en la lista. Si quedó entero afuera, se oculta. Lo mismo para puntos
  y trazos.
- Si en lo que se mira no hay nada, la lista lo dice y pide alejarse o mover
  el mapa.
- El mapa sigue dibujando todo lo tildado. La lista no apaga lo que quedó
  afuera: al volver a ese lugar, reaparece como estaba.
- La tilde de una categoría cambia solo lo que está listado en ese momento.
  Lo de afuera conserva su tilde.
- Mientras los Caminos se están abriendo, siguen en la lista. Cuando ya se
  sabe por dónde van, queda solo el que entra en el mapa.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión: solo en Marcas; la lista sigue el perímetro
  de lo que se ve, al acercarse y al moverse.
- La lista y el mapa de Marcas, y que Consultas no enumera marca por marca.

### Inferido

- Un Camino que rodea el mapa sin entrar no se lista, aunque el recuadro que
  lo envuelve sí tape lo que se mira.

### Pendiente de verificación

- Probarlo en el celular, con la cuenta iniciada, acercando y moviendo el mapa.
