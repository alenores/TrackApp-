# 039 — Límites de texto de Caminos

**Decidido por Alejandro:** 2026-10-06 · **Estado:** preparado en la lógica y el SQL; base sin modificar

## Decisión

Cada Camino admite hasta **120 caracteres en el nombre** y **2.000 caracteres
en la descripción**. La observación compartida de cada parte admite hasta
**1.000 caracteres**.

Estos son los límites propuestos en la segunda etapa de guardado y confirmados
por Alejandro. La app debe avisar con claridad si un texto los supera. La base
también debe rechazarlos si alguien intenta saltarse la app.

## Estado de implementación

La lógica de guardado y el SQL propuesto contienen estos límites. El SQL aún
no se ejecutó, y las pantallas de Caminos todavía no existen.
