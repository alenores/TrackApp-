# 061 — Marcar un punto o un trazo navegando

**Fecha:** 2026-10-16 · **Decidió:** Ale
**Ajusta la decisión 023** en cómo se elige el lugar.

## La decisión

Desde la navegación libre y desde la de un Circuito, la pantalla de marcar
tiene arriba a la derecha el ícono de centrar en el GPS —el mismo de toda la
app— y, a su derecha, una X que cierra. El botón de atrás del celular también
cierra esa pantalla.

Al abrirse, el pedazo de mapa que queda arriba del formulario se centra donde
está el GPS, para ver el lugar del punto.

Un punto queda donde está el GPS si no se toca nada. Un toque en el mapa lo
mueve a ese lugar. Se puede volver a la posición del GPS.

Un trazo no arranca en el GPS. En el formulario se aprieta «Comenzar a
dibujar»: el panel se achica, el mapa queda a la vista y los puntos se cargan
tocando, a mano. Mientras se dibuja se ven deshacer, cancelar y finalizar.
Finalizar vuelve al formulario; se guarda con Guardar.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.

### Inferido

- Finalizar no guarda: en la app nada se guarda solo, y Guardar sigue siendo
  el botón de guardar.

### Pendiente de verificación

- Probarlo en el celular, en las dos navegaciones, con punto y con trazo.
