# 008 — Tres modos de uso y permisos sobre las rutas

**Fecha:** 2026-09-18 · **Estado:** vigente

## Permisos sobre las rutas

**Cualquier usuario ve y consulta todas las rutas**, sin importar quién las
subió ni de qué categoría sea.

**Solo el creador de una ruta puede editarla o eliminarla.**

Eso es todo. No hay más restricciones, y no se agregan sin una decisión nueva.

## Los tres modos de uso

Al abrir una ruta, el usuario navega en uno de estos tres modos, según lo que
haya descargado:

| Modo | Qué se ve |
|---|---|
| **Sin mapa** | La línea de la ruta y el punto de GPS sobre fondo vacío |
| **Mapa simple** | Lo anterior sobre cartografía con curvas de nivel |
| **Mapa satelital** | Lo anterior sobre la foto del terreno |

**Sin mapa es un modo legítimo, no una falla.** No se presenta como error, no se
presenta como degradado, no se pide disculpas. Es una opción válida para quien
no quiere ocupar espacio en el celular.

## Por qué "sin mapa" funciona

**El cálculo del desvío no consulta el mapa.** Es matemática entre la posición
del GPS y la línea de la ruta. El mapa aporta contexto visual, no es insumo del
cálculo.

Consecuencia: la función central de la app —saber si vas por el camino o te
desviaste— funciona en los tres modos por igual.

**Lo que sí se pierde sin mapa:** el usuario ve que se desvió y ve hacia dónde
queda la línea, pero no sabe qué hay en el medio. Un barranco, un arroyo o un
alambrado entre él y la ruta es invisible.

## Consecuencia para el desarrollo

Las tres variantes son el mismo modo de navegación con distinto fondo. **No se
construyen tres pantallas de navegación.** Se construye una, que dibuja un fondo
distinto según lo descargado.
