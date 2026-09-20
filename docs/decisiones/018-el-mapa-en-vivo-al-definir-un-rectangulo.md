# 018 — El mapa en vivo en las pantallas de administrar

**Fecha:** 2026-09-19 · **Estado:** vigente

---

## El problema que lo origina

Al crear una zona o un sector, la pantalla muestra el rectángulo que se está
definiendo y dice: *«Mirá que el recuadro caiga donde querés antes de guardar.»*

**Pero abajo no hay mapa**, y sin mapa esa frase pide algo imposible: un
rectángulo flotando en gris no dice nada. Para saber si cae donde uno quiere
hacen falta los pueblos, los ríos y el cerro.

Y no es que falte el archivo: **nunca va a estar**. El fondo sale de lo que el
usuario tiene descargado, y **el rectángulo de una zona no se descarga jamás**.
La pantalla donde más falta hace el mapa era justo la única que por diseño nunca
iba a tener uno.

## Decisión

**Al definir el rectángulo de una zona o de un sector, el mapa se trae en vivo.**

- Usa **el mismo puente** que ya existe para bajar mapas. No hay nada nuevo que
  alojar ni ninguna fuente nueva.
- **No descarga nada**: es para mirar, ahí, en ese momento.
- Es **la única pantalla** de toda la app que hace esto.

## Esto no es una excepción: es lo normal

**Administrar se hace sentado en la computadora, con conexión.** Crear y editar
zonas, sectores y rutas, marcar rectángulos, mirar dónde cae cada cosa. Sin
conexión esas pantallas no sirven para nada aunque el mapa estuviera guardado,
porque las coordenadas se pegan desde Google Maps, que también necesita
internet.

**La única pantalla que trabaja sin señal es la de navegar**, y esa sigue
leyendo solo lo guardado. Eso no se toca ni se discute.

Alcanza con las pantallas donde el mapa se mira: armar una zona, armar un
sector, y el detalle de una zona con sus sectores encima.

**Prohibido a los agentes volver a plantear el tema.** No hay que diseñar
respaldos, modos degradados ni avisos pensando en un administrador sin señal.
