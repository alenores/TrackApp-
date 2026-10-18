# 068 — Circuitos en el mapa, sin otro mapa adentro

**Fecha:** 2026-10-18 · **Decidió:** Ale
**Ajusta** la decisión 025 en la navegación de un Circuito.

## La decisión

La ventana «Circuitos en el mapa» se lee en tres partes, sin un texto de ayuda.

1. **El lugar.** Si la zona tiene un solo sector, se ven su nombre y la zona.
   Si hay varios, cada sector es un botón con su nombre: el elegido se marca.
   Si hay más de una zona, primero se elige la zona, del mismo modo.
2. **El que navegás.** El nombre entero, aparte, sin tilde. No se apaga.
3. **En este sector.** Solo los otros Circuitos, con tilde. **Todos** y
   **Ninguno** aparecen cuando hay al menos uno. Si no hay, dice «No hay
   otros Circuitos en este sector.»

No hay un mapa chico para cambiar de sector. Lo que se prendió en otro
sector sigue prendido.

## Por qué

El ícono de mapa, adentro de una ventana que ya está sobre el mapa, no se
entendía. El sector, el Circuito que se está haciendo y los demás quedaban
mezclados en un solo bloque.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión, con la ventana abierta en un Circuito que
  toca un solo sector.
- La ventana que abría un mapa chico detrás de un ícono.

### Inferido

- Con una sola zona, el nombre de la zona queda escrito bajo el sector. Con
  varias, la zona se elige antes y no se repite.

### Pendiente de verificación

- Abrirlo en un Circuito cuya zona tenga varios sectores, y en una con uno solo.
