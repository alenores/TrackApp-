# 001 — Diseño para exterior

**Fecha:** 2026-09-17 · **Estado:** vigente

## Contexto

TrackApp se usa caminando al aire libre: sol fuerte, una sola mano,
sin señal, batería contada, a veces pantalla mojada. El diseño anterior no
contemplaba ninguna de esas condiciones.

## Decisión

1. **Dos modos de color conmutables a mano**, no automáticos. Sol = fondo claro
   con texto oscuro. Noche = fondo oscuro con texto claro.
2. **Contraste mínimo 7:1** para texto normal, 4.5:1 para texto grande e íconos.
3. ~~**Zona tocable mínima de 56 px**, 64 px en la pantalla de navegación.~~
   **Anulado el 2026-09-25** por la decisión 024: todos los botones tienen el
   tamaño normal.
4. **Ningún gesto fino puede ser la única forma de hacer algo.**
5. **Lo importante va en la mitad de abajo** de la pantalla.
6. **El mapa de navegación va a pantalla completa**, con salida visible y botón
   físico de atrás funcionando.
7. **La pantalla no se apaga mientras se navega.**
8. **Las alertas críticas vibran**, no solo se muestran.
9. **Toda acción destructiva pide confirmación** (pantalla mojada).

El razonamiento completo está en `../DISENO_EXTERIOR.md`.

## Consecuencias

- Hay que construir un conjunto de piezas de interfaz compartidas que cumplan
  esto por defecto. Una pantalla nueva no debería poder violarlo sin esfuerzo.
- Las pantallas actuales no cumplen. Se van adaptando por módulo.
- Los valores numéricos son provisorios hasta probarlos al sol.

## Alternativa descartada

**Modo oscuro único**, por ser más sobrio visualmente. Se descartó: con sol
directo el modo oscuro es objetivamente menos legible, porque la pantalla no le
gana en brillo a la luz ambiente.
