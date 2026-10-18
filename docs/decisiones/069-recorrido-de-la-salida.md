# 069 — El recorrido de una salida

**Fecha:** 2026-10-18 · **Decidió:** Ale

## La decisión

En el detalle de una salida, la miniatura del recorrido va el doble de grande.
Debajo, si el archivo GPS trae alturas, se ve el gráfico.

Al abrir el mapa, la línea del recorrido en modo claro es naranja. De noche
sigue clara.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.
- La línea del mapa usaba el color de «sin clasificar»: gris con sol, clara de noche.

### Inferido

- Si el archivo no trae alturas, no se muestra el gráfico.

### Pendiente de verificación

- Mirarlo en el celular: miniatura, gráfico y línea naranja con sol.
