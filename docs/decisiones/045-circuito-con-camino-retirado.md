# 045 — Un Camino retirado sigue visible en el Circuito que lo usa

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; implementación pendiente

## Decisión

Si se retira de Mapas un Camino que forma parte de un Circuito, esa parte del
Circuito sigue visible. La app muestra un aviso antes de salir para que la
persona sepa que el Camino fue retirado del mapa general. No borra la parte
del Circuito ni dibuja una unión nueva en su lugar.

Esta decisión responde la primera pregunta del informe técnico de Circuitos.
Todavía no define cómo se conservará la línea al guardar el Circuito ni cómo
se sincronizará el retiro; esos son trabajos técnicos pendientes.

## Auditoría de fuentes

- **Leído en tiempo real:** informe técnico de Circuitos del 2026-10-07 y decisión 044.
- **Decidido por Alejandro:** mantener visible la parte de un Camino retirado dentro del Circuito y mostrar un aviso.
- **Inferido:** conservar el dibujo y el aviso en los datos preparados antes de salir permite mostrarlos sin conexión.
- **Pendiente de verificación:** implementación y prueba de guardado, actualización y navegación de Circuitos.
