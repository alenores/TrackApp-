# Revisión visual de Mapas

**final result: passed**

## Hallazgos

- Se abrió la pantalla con la sesión local ya iniciada y se revisó en escritorio
  con el modo sol y el modo noche.
- Se comprobó que el rótulo parte en 12 px en el mapa alejado, crece a 14 y 16 px
  al acercarse, y reduce también el espacio alrededor en el nivel más lejano.
- La prueba automática verifica que la ficha de hover se cierre al sacar el
  cursor y que la selección fijada por clic siga disponible hasta cerrarla.

## Alcance comprobado

- La ficha conserva nombre, cantidad de sectores, descripción y acceso **Ver
  zona**. Los perímetros generales no muestran divisiones ni nombres de sectores.
- La prueba automática del componente pasó junto con TypeScript y lint.

## Fuera de esta revisión

- La vista móvil no se capturó en esta sesión. El cierre por toque afuera se
  mantiene según el comportamiento acordado.
