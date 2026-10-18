# 066 — El aviso de mapa faltante es un círculo

**Fecha:** 2026-10-18 · **Decidió:** Ale

## La decisión

En la navegación, si falta mapa, arriba a la izquierda hay un círculo ámbar
con «!», del mismo alto que el botón Simple. El texto no está siempre a la
vista: se muestra al tocar el círculo y se cierra al tocar afuera. El atrás
del celular y Escape también lo cierran.

El texto dice el caso de verdad: cuántos kilómetros quedan sin mapa, o qué
sector falta bajar. «Sin mapa descargado» queda solo para cuando no hay
ningún mapa bajado.

## Por qué

La pastilla siempre abierta decía «Sin mapa descargado» aunque faltara un
tramo chico y el mapa simple sí estuviera. Tapaba el mapa y nombraba el
problema más grande de lo que era.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.
- El aviso que ya calculaba el tramo sin mapa, y la pastilla que no lo decía.

### Inferido

- Tocar el círculo de nuevo también cierra el texto, igual que tocarlo de nuevo
  para abrirlo.

### Pendiente de verificación

- Mirarlo en el celular, navegando un Circuito que tenga el simple bajado y un
  tramo sin mapa.
