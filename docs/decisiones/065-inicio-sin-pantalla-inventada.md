# 065 — Sin pantalla inventada al abrir

**Fecha:** 2026-10-17 · **Decidió:** Ale

## La decisión

La pantalla que aparecía al abrir, con el aviso de que Salidas necesita
conexión y los accesos a Circuitos y Navegación libre, **no existe**.

Mientras la app todavía no sabe si hay señal, solo se ve que está pensando.
Cuando ya sabe, abre un solo lugar:

- Con señal, Salidas.
- Sin señal, sin internet o en modo avión, Circuitos, la pantalla de siempre.

Navegación libre sigue en el menú. No se ofrece en una pantalla aparte.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión.
- La entrada que mostraba el aviso y los dos accesos.
- La decisión 051, que había dejado ese aviso para el inicio sin señal.

### Inferido

- Ninguno.

### Pendiente de verificación

- Abrir la app con señal y ver que no aparece el aviso: primero piensa y
  después abre Salidas.
- Abrir en modo avión y ver que abre Circuitos.
