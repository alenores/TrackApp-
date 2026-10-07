# 035 — Zonas y sectores solo organizan las descargas de mapas

**Decidido por Alejandro:** 2026-10-05 · **Estado:** definición de producto; adaptación pendiente

## Propósito único

Zonas y sectores fragmentan el territorio para elegir y descargar los mapas
que harán falta antes de salir. No clasifican ni delimitan Caminos, Circuitos,
puntos o trazos. El número de zonas o sectores que cruza una línea no cambia
su identidad ni obliga a partirla.

## Uso antes de salir

- Si se planificó un Circuito, su ubicación sirve para determinar qué mapas
  hacen falta descargar.
- Si la persona va a explorar sin Circuito, puede mirar el área que piensa
  recorrer y elegir los mapas que necesita descargar.
- Esta relación es solo de **cobertura de mapas**. Un Camino no necesita
  pertenecer a una zona o sector para existir, editarse o verse.
- Los puntos y trazos tampoco deben depender de una zona o sector como
  clasificación del contenido del mapa.

La app debe mostrar los faltantes que pueda conocer mientras haya conexión y
antes de salir, conforme a las reglas offline existentes. Esta decisión no
implica descargar mapas automáticamente ni cambia la unidad de descarga.

## Estado de implementación

La app actual todavía asocia algunas anotaciones y rutas con zonas o sectores
para otras funciones. Al implementar la nueva estructura hay que revisar esos
usos y dejar a zonas y sectores únicamente su función de cobertura y descarga.
No se modificó código ni base por esta decisión.

## Auditoría de fuentes

- **Leído en tiempo real:** plan de Mapas/Caminos/Circuitos, glosario y
  auditoría de Caminos de Claude.
- **Decidido por Alejandro:** zonas y sectores tienen como único propósito
  fragmentar las descargas; no delimitan Caminos aunque crucen muchas zonas.
- **Pendiente de verificación:** adaptación de las pantallas, el modelo de
  datos y los avisos previos de cobertura al desarrollar las funciones.
