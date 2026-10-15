# 060 — Líneas de paso sobre el satelital

**Fecha:** 2026-10-15 · **Decidió:** Ale

## La decisión

En la navegación libre y en la de un Circuito, el mapa satelital dibuja encima
de la foto las líneas que ya se ven en el mapa simple: ríos, arroyos, senderos
y huellas. El relleno de tierra, pasto y bosque no se pinta. La foto se
sigue viendo.

No hace falta bajar nada nuevo. Esas líneas ya vienen con el mapa satelital:
hasta ahora, sobre la foto, solo se escribían los nombres.

Al marcar un rectángulo —zonas, sectores, con la foto en vivo— la foto queda
sin esas líneas. Ahí se mira el terreno.

Las huellas y las calles no usan el color del mapa simple. Allí son casi
blancas de día y casi negras de noche, y sobre la foto desaparecen. En el
satelital van oscuras con sol y claras de noche. Ríos, arroyos y senderos
conservan el color que ya tienen.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale: las líneas del mapa simple (ríos y caminos, entre otras) se
  leen bien, y en la foto satelital de poca definición no. Quiere esas líneas
  sobre la foto, en las dos navegaciones, sin tapar el terreno.
- Hasta este cambio, sobre la foto iban solo los nombres. El dibujo del mapa
  ya baja junto con el satelital.
- Decisión 013, sobre las curvas encima de los dos mapas.

### Inferido

- El color de las huellas tiene que cambiar sobre la foto: el del mapa simple
  no se distingue del terreno.

### Pendiente de verificación

- Mirarlo en el celular, con un mapa satelital ya bajado, de día y de noche.
