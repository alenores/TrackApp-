# 043 — Se puede guardar un Circuito con partes sin unir

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; implementación pendiente

## Decisión

Un Circuito se puede guardar aunque dos partes de su dibujo queden separadas
y todavía no se haya trazado la unión. La app debe avisar claramente que el
Circuito tiene partes sin unir. La separación sigue visible en el mapa; no se inventa
una conexión ni se dibuja una línea que el usuario no marcó.

Antes de salir, el estado incompleto se vuelve a mostrar para que la persona
sepa dónde falta definir el paso, junto con los demás avisos del Circuito.

## Alcance pendiente

La pantalla exacta del aviso y la manera de seleccionar, ordenar y unir las
partes se diseñarán en el editor de Circuitos. Esta decisión no establece una
distancia mínima que convierta una separación pequeña en un enlace: esa regla
necesita diseño y validación.

## Auditoría de fuentes

- **Leído en tiempo real:** decisión 034 y reglas de producto de `AGENTS.md` sobre avisar antes de salir y navegar sin conexión.
- **Decidido por Alejandro:** permitir guardar el Circuito con partes separadas y avisar que esas partes están sin unir.
- **Inferido:** no se debe presentar una unión inexistente como un recorrido confirmado.
- **Pendiente de verificación:** interacción visual, persistencia y pruebas del aviso con y sin señal.
