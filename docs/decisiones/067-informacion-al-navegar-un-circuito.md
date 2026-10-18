# 067 — Información al navegar un Circuito

**Fecha:** 2026-10-18 · **Decidió:** Ale

## La decisión

Al navegar un Circuito, el círculo que abría «Alturas» pasa a llamarse
**Información**. El título de la ventana es Información: dice qué muestra, no
el nombre del Circuito.

Adentro, en este orden:

1. El nombre del Circuito.
2. Una miniatura de la línea vista desde arriba, con el color y la marca de
   cada tramo, igual que en el mapa. Si el GPS sabe en qué punto de la línea
   estás, un punto marca ese lugar. Al lado, el largo total y lo que llevás
   recorrido. Si no hay posición, o si estás lejos de la línea, la miniatura
   se ve igual y el texto dice por qué no marca dónde estás.
3. El gráfico de alturas, como estaba: «Estás acá» y lo que falta de subida
   y de bajada hasta el final.

La ayuda de colores y líneas no está siempre a la vista. Se abre con el
círculo de ayuda, del tamaño normal, y se cierra al tocarlo de nuevo. Sirve
para cuando uno se olvidó qué significa cada color y cada línea.

## Por qué

«Alturas» nombraba solo el gráfico, y abajo aparecían colores y líneas que
hablan de otra cosa. La ventana ahora es el retrato del Circuito: cómo es la
forma, cómo está clasificada y cómo sube y baja.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión, confirmado el 2026-10-18.
- La ventana que se llamaba Alturas y la ficha de Camino, cuyo título dice
  de qué se trata y el nombre va adentro (decisión 063).
- La miniatura de la línea en las tarjetas de salidas, de un solo color.
- La ayuda de colores que el detalle del Circuito ya abre con un círculo.

### Inferido

- El punto de «dónde estás» usa la misma regla que el gráfico: más lejos de
  100 m de la línea, no se marca.

### Pendiente de verificación

- Abrir Información en el celular, de día y de noche, con un Circuito que
  mezcle tramos de distinto color.
