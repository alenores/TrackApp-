# Revisión visual de Mapas

**final result: passed**

## Hallazgos

- Se abrió la pantalla con la sesión local ya iniciada y se revisó en escritorio
  con el modo sol y el modo noche.
- Se comprobó que el rótulo parte en 12 px en el mapa alejado, crece a 14 y 16 px
  al acercarse, reduce también el espacio alrededor en el nivel más lejano y se
  desvanece en el encuadre provincial.
- Los íconos y puntos reducen tamaño y opacidad al alejarse; MapLibre descarta
  los íconos que se superponen.
- La ficha se abre al hacer clic o tocar la zona, y se cierra al hacer clic o
  tocar afuera. Mover el cursor no la abre; pellizcar el mapa queda disponible
  para cambiar el zoom.

## Alcance comprobado

- La ficha conserva nombre, cantidad de sectores, descripción y acceso **Ver
  zona**. Los perímetros generales no muestran divisiones ni nombres de sectores.
- La prueba automática del componente cubre el cierre con clic/toque afuera y
  que tocar dentro de la ficha no la cierre.
- La dirección local `localhost:3000` no tenía un servidor activo. El que está
  abierto y dibuja el mapa es `localhost:3005`.

## Fuera de esta revisión

- La vista móvil no se capturó en esta sesión. El cierre por toque afuera se
  mantiene según el comportamiento acordado.
