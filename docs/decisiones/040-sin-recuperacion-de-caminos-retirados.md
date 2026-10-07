# 040 — No recuperar Caminos retirados desde la app

**Decidido por Alejandro:** 2026-10-06 · **Estado:** decisión de producto

## Decisión

La app **no ofrece recuperar un Camino retirado**, tampoco al administrador.
Alejandro respondió que no quiere esa función.

Retirar sigue siendo un borrado lógico: se conserva el registro con
`eliminado_en` para comunicar la baja a los demás dispositivos. No se agrega
un botón ni una acción de servidor para recuperarlo.

Esta decisión se refiere a la función visible de la app. No cambia el deber
de conservar la baja en la base para la sincronización.
