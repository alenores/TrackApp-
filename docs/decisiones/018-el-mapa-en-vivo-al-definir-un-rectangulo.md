# 018 — El mapa en vivo al definir un rectángulo

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

## Por qué no contradice la regla del offline

La regla dice: *«Las pantallas leen de lo guardado en el celular, nunca de
internet.»* Su motivo es que la app tiene que servir en el cerro.

Definir un rectángulo **no se hace en el cerro**. Se hace en casa, con señal,
pegando direcciones de Google Maps que también necesitan internet. Sin señal esa
pantalla no sirve para nada aunque el mapa estuviera guardado, porque las
direcciones que se pegan vienen de internet.

**Navegar no cambia en nada.** La navegación sigue leyendo solo lo guardado, y
eso no se toca ni se discute.

## Lo que sí se mantiene

- Si no hay señal al definir un rectángulo, **el rectángulo se dibuja igual**
  sobre fondo liso, y el mapa dice que el fondo no se pudo traer. Nunca queda
  una pantalla muda.
- Ninguna otra pantalla pide nada a internet para dibujarse.
