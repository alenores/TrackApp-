# 081 — Contraste de pasos y satelital de navegación

Fecha: 2026-10-22 (publicada 2026-11-01). Decisión de Ale.

> La 078 quedó para Casa y Atención en puntos.

## Problema

Los senderos discontinuos se confundían con las curvas doradas sobre el satelital. La apariencia clara de la foto perjudicaba su lectura. En el simple las calles tenían poco contraste contra el fondo.

## Decisión

- Senderos y huellas usan la misma familia de color que las calles y rutas del mapa base; mantienen su línea discontinua.
- En navegación libre y de Circuitos, el satelital usa siempre la apariencia de noche y no ofrece el botón de modo.
- El simple conserva el cambio manual: pasos oscuros de día y claros de noche.
- La preferencia del simple y del resto de la app no cambia al entrar o salir del satelital.
- Se conservan los colores de agua y curvas, la elección de mostrar curvas y las fuentes descargadas.

## Auditoría de fuentes

- Leído en tiempo real: pedido de Ale; mapa compartido; capas del fondo; variables de color; lectura del modo.
- Inferido: una paleta local evita cambiar la preferencia general al cambiar de fondo.
- Pendiente de verificación: lectura sobre terreno real en un celular al sol.
