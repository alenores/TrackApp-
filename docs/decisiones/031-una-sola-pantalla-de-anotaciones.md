# 031 — Una sola pantalla de anotaciones

**Decidido:** 2026-10-02 · **Mockup aprobado por Ale** · Reemplaza en parte a la 030

## Decisión

La pestaña **Puntos** de Mapas y la pantalla de **Anotaciones** del sector
hacían lo mismo de dos formas distintas. Ahora son **una sola pantalla de
anotaciones**, que se usa en los dos lugares; lo único que cambia es qué parte
del mapa se mira (toda Córdoba o el sector).

- La pestaña de Mapas se llama **Anotaciones**. Sigue siendo solo del
  administrador. `/zonas/puntos` y `vista=puntos` siguen llevando a ella.
- En los dos lugares se marcan **puntos y trazos**. Lo que el administrador
  anota desde Mapas no queda atado a un sector (decisión 027), también los
  trazos: la base ya lo permitía y el servidor dejó de rechazarlo.
- Un punto se ubica **tocando el mapa o pegando la coordenada** de Google
  Earth. Tocar el mapa escribe la coordenada: hay un solo dato.
- Una anotación se abre **tocándola en el mapa o en la lista**. No hay botones
  chicos de editar ni de borrar. **Borrar está adentro del formulario** y pide
  confirmación.
- La lista es la misma: el dibujo del ícono (o la rayita de color del trazo),
  de qué se trata y de dónde salió. Filtra por tipo (todas, puntos, trazos) e
  ícono; en Mapas, también por zona y sector.
- **Traer de Google Earth y de OpenStreetMap queda solo en el sector.** Las dos
  traen lo que cae adentro de un rectángulo, y el sector les da ese límite. En
  toda Córdoba llegarían miles de tranqueras de una vez.

## Motivo

Dos pantallas para lo mismo obligan a aprender dos maneras y a mantener dos
códigos: cambiar una regla de cómo se anota había que hacerlo dos veces, y la
de Mapas ni siquiera tenía trazos.

## Dónde vive

Los datos y el guardado, en un solo lugar (`hooks/use-anotaciones.ts`, con sus
pruebas). La pantalla compartida es `EditorDeAnotaciones`; cada lugar solo le
dice qué mirar.

## Auditoría de fuentes

- Leído en tiempo real: las dos pantallas, el guardado de anotaciones en el
  servidor y las restricciones de la tabla `anotaciones` en la base.
- Pendiente de verificación: revisión de la pantalla publicada en el celular.
