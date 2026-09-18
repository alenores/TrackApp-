# 005 — Pruebas automáticas como red de seguridad

**Fecha:** 2026-09-18 · **Estado:** vigente

## Contexto

Ale no lee código. El desarrollo lo hacen agentes de IA. Hoy la app no tiene
ninguna prueba automática: cada cambio es un acto de fe y un agente puede romper
algo arreglando otra cosa sin que nadie se entere hasta que falla en el cerro.

Esto no es un riesgo teórico: es el modo de trabajo real del proyecto.

## Decisión

**Ninguna función de la que dependa la seguridad del usuario se entrega sin una
prueba automática que la cubra.** La prueba se escribe junto con la función.

**Qué funciones entran en esa categoría se decide cuando cada función se define.**
No se lista de antemano.

**Una prueba que falla nunca se ajusta para que pase.** Se arregla lo que rompió.
Prohibido saltear, desactivar o tapar una prueba para llegar a verde.

## Motivo

Es el único mecanismo que le avisa a Ale que algo se rompió sin que tenga que
leer código. Sin esto, todas las demás reglas del proyecto son decorado: se
pueden violar en silencio y nadie lo detecta.

## Alcance deliberadamente acotado

Se cubre **lo crítico**, no todo. Una batería enorme que nadie mira y que tarda
diez minutos se termina ignorando, y una prueba ignorada no protege nada.

## Pendiente

Elegir la herramienta de pruebas. Se resuelve al escribir la primera, no antes.
