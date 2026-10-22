# 073 — Cambiar la actividad en Marcas conserva la vista

**Fecha:** 2026-10-22 · **Decidió:** Ale

## La decisión

En Marcas, tocar una actividad conserva exactamente el centro y el zoom
del mapa. También al elegir «Todas» o repetir la actividad ya seleccionada.
La actividad sigue filtrando los Caminos y eligiendo sus colores.

Elegir una marca de la lista sigue llevando el mapa hasta ella.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale y confirmación de que el salto sucede apenas toca una actividad.
- La pantalla de Marcas ordenaba encuadrar todas las marcas después de cualquier filtro.
- Prueba automática de todas las actividades, «Todas» y selección repetida en
  las distribuciones de PC y celular, conservando la orden previa de cámara.

### Inferido

- Ninguno.

### Pendiente de verificación

- Revisión visual con la cuenta de Ale: el navegador disponible muestra
  el aviso de falta de conexión y no permite comprobar el mapa publicado.
