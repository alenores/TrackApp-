# 033 — Condición y complejidad de cada parte de una ruta

**Decidido:** 2026-10-05 · **Estado:** prototipo descartado el 2026-10-08 al retirar Rutas (decisión 049). Las reglas de condición y complejidad viven en las partes de cada Camino

**Revisión posterior de Ale:** los caminos explorables deben formar parte de
Mapas y una planificación separada debe llamarse Circuitos. Este documento
explica el prototipo existente y conserva las reglas de condición y complejidad,
pero **no aprueba mantener las partes dentro de Rutas**. Ver
`docs/planes/2026-10-05-mapas-caminos-circuitos.md`. Nada de esto se publicó.

## El uso real

Ale dibuja posibilidades en Google Earth antes de salir. En el cerro necesita
ver rutas alternativas y puntos de referencia para decidir por dónde seguir.
Una línea dibujada desde casa no garantiza que se pueda pasar: puede haber
maleza, un derrumbe o una prohibición. También puede ser transitable llevando
la bicicleta o el kayak a pie durante una sección corta.

## Decisiones

- Cada ruta se divide en partes independientes marcando inicio y final en el
  editor de computadora.
- Cada parte tiene condición de paso: `por_explorar`, `transitable`, `a_pie` o
  `sin_paso`. La línea sin paso permanece visible con X negras.
- La complejidad local es `facil`, `media`, `dificil` o sin clasificar. Verde,
  amarillo y rojo indican solamente complejidad. Una X nunca asigna rojo.
- Una parte por explorar puede tener una complejidad estimada; si no la tiene,
  se dibuja en gris. No se interpreta como fácil.
- Esfuerzo y dificultad técnica de la ruta completa permanecen en la ficha.
  No se calculan ni se pintan desde las partes.
- La observación y la fecha de comprobación se consultan al tocar la parte.
- La copia de la ruta con sus partes se descarga al celular. Navegando se lee
  solo esa copia, incluso cuando el usuario mira otras rutas en el mismo mapa.
- Un KML con varias líneas ofrece cada una como ruta separada, con su propio
  archivo de respaldo. No se suman alternativas inconexas como una única ruta.
- Edita las partes quien subió la ruta, igual que el resto de sus datos. Los
  demás usuarios pueden consultarlas en el mapa.

## Cómo se guarda

Las partes son `LineString` dentro del GeoJSON de `rutas.geometria`. Cada una
conserva la identidad de su línea original y las distancias de inicio y final,
además de sus datos. Una edición divide solo los intervalos tocados y preserva
la geometría, el largo y las alturas de los demás. No se agregó tabla nueva.

## Auditoría de fuentes

- **Leído en tiempo real:** conversación con Ale; esquema de `rutas` en la base;
  lector de KML, mapas y puesta al día del repositorio.
- **Inferido:** la complejidad ausente se dibuja en gris para no sugerir que es
  fácil; el permiso de edición sigue el permiso existente de la ruta.
- **Pendiente de verificación:** navegación completa con una sesión real y el
  teléfono en modo avión. La pantalla del editor se revisó con una ruta
  ficticia local en modo sol y noche.
