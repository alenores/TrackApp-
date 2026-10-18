# 064 — Escape cierra la cruz

**Fecha:** 2026-10-17 · **Decidió:** Ale

## La decisión

En la computadora, la tecla Escape hace lo mismo que la cruz que cierra una
pantalla, un panel o una ventana. Si hay varias, cierra solo la de adelante.
La de atrás se queda.

También vale para la cruz de salir de la navegación: Escape pregunta si querés
salir. Si en ese momento hay una ventana abierta, Escape cierra esa ventana y
no sale de la navegación.

El botón de atrás del celular sigue la misma regla: cierra solo la ventana que
está adelante. La de atrás se queda.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.
- La cruz de cerrar, compartida en ventanas, fichas, paneles, el mapa en grande
  y salir de la navegación.
- El atrás del celular, que ya cerraba varias de esas pantallas.

### Inferido

- Si hay dos abiertas, Escape no tiene que cerrar las dos: cierra la de
  adelante, igual que se espera de esa tecla.

### Pendiente de verificación

- Probarlo en la computadora: una ventana, un panel con otra ventana encima, y
  la navegación con la ficha de un Camino abierta.
