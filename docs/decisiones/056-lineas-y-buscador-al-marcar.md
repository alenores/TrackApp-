# 056 — Líneas de zonas y sectores, y buscador al marcar

**Fecha:** 2026-10-15 · **Decidió:** Ale

## La decisión

En Consultas, en punto nuevo, en Camino nuevo y en trazo nuevo hay tres
opciones de líneas: nada, zonas, o zonas y sectores. Los sectores no se ven
solos.

- En Consultas, al abrir, está elegida la de las zonas.
- Al marcar un punto, un Camino o un trazo, al abrir no hay líneas. Las
  opciones van arriba de los datos: debajo del mapa en el celular, y en la
  columna de la derecha en la computadora.

En esos tres mapas de marcar, junto a ubicarme y ver en grande, hay una lupa.

- Mientras se escribe, filtra zonas, sectores, Caminos, puntos y trazos. Eso
  no sale a internet.
- Los pueblos, ciudades y localidades se buscan al apretar un botón, una sola
  vez, en el mismo panel. Salen del mapa de fondo, no de Google, y solo de
  Argentina.
- Al elegir cualquiera, el mapa viaja hasta ahí. Elegir una zona prende sus
  líneas si estaban apagadas; elegir un sector prende también las de los
  sectores.

Marcas y la navegación libre siguen sin dibujar sectores.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale en esta sesión: las tres opciones, el lugar, el valor por
  defecto en Consultas y en marcar, y el botón aparte para pueblos.
- Decisiones 029, 050 y 055, y la regla de que estos mapas de marcar usan el
  mapa propio con internet.

### Inferido

- Los pueblos se preguntan al servicio público de lugares de OpenStreetMap,
  una vez por botón, porque la app no tiene esa lista.

### Pendiente de verificación

- Probar la lupa y las tres opciones en el celular, con la cuenta iniciada.
