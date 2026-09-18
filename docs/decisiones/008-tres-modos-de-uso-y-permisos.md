# 008 — Tres modos de uso y permisos sobre los tracks

**Fecha:** 2026-09-18 · **Estado:** vigente

## Permisos sobre los tracks

**Cualquier usuario ve y consulta todos los tracks**, sin importar quién los
subió ni de qué categoría sea.

**Solo el creador de un track puede editarlo o eliminarlo.**

Eso es todo. No hay más restricciones, y no se agregan sin una decisión nueva.

## Los tres modos de uso

Al abrir un track, el usuario navega en uno de estos tres modos, según lo que
haya descargado:

| Modo | Qué se ve |
|---|---|
| **Sin mapa** | La línea del track y el punto de GPS sobre fondo vacío |
| **Mapa simple** | Lo anterior sobre cartografía con curvas de nivel |
| **Mapa satelital** | Lo anterior sobre la foto del terreno |

**Sin mapa es un modo legítimo, no una falla.** No se presenta como error, no se
presenta como degradado, no se pide disculpas. Es una opción válida para quien
no quiere ocupar espacio en el celular.

## Por qué "sin mapa" funciona

**El cálculo del desvío no consulta el mapa.** Es matemática entre la posición
del GPS y la línea del track. El mapa aporta contexto visual, no es insumo del
cálculo.

Consecuencia: la función central de la app —saber si vas por el camino o te
desviaste— funciona en los tres modos por igual.

**Lo que sí se pierde sin mapa:** el usuario ve que se desvió y ve hacia dónde
queda la línea, pero no sabe qué hay en el medio. Un barranco, un arroyo o un
alambrado entre él y el track son invisibles.

## Consecuencia para el desarrollo

Las tres variantes son el mismo modo de navegación con distinto fondo. **No se
construyen tres pantallas de navegación.** Se construye una, que dibuja un fondo
distinto según lo descargado.
