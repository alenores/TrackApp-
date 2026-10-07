# 042 — Un Circuito sigue las correcciones de sus Caminos

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; implementación pendiente

## Decisión

Cuando un Circuito incorpora una parte de un Camino, conserva el vínculo con
ese Camino. Si luego se corrige el dibujo del Camino, el Circuito debe seguir
la línea corregida. Antes de salir, la app debe avisar que cambió el plan y
mostrar lo necesario para revisarlo con señal. El aviso debe llegar también a
quien tenga el Circuito descargado: navegar no consulta internet.

Corregir la línea de un Camino no cambia automáticamente su condición de paso,
complejidad, observación o fecha de comprobación. Esos datos se modifican solo
mediante una edición expresa, según la decisión 037.

## Alcance pendiente

La forma técnica de conservar los extremos de la parte incorporada cuando la
corrección cambia largo o cantidad de puntos requiere una propuesta y pruebas.
Tampoco se ha definido qué sucede si el Camino se retira o si una parte usada
por el Circuito pasa a «sin paso». Ninguna de esas reglas se deduce aquí.

## Auditoría de fuentes

- **Leído en tiempo real:** decisión 034, decisión 037, plan de Mapas/Caminos/Circuitos y código de guardado de Caminos.
- **Decidido por Alejandro:** el Circuito sigue la corrección del Camino y avisa antes de salir.
- **Inferido:** para avisar antes de salir sin consultar internet en el cerro, el cambio debe detectarse y prepararse mientras hay señal.
- **Pendiente de verificación:** diseño del vínculo, aviso, actualización del paquete y pruebas con una corrección real.
