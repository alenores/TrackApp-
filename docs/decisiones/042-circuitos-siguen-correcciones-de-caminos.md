# 042 — Un Circuito sigue las correcciones de sus Caminos

**Decidido por Alejandro:** 2026-10-07 · **Estado:** definición de producto; implementación pendiente

## Decisión

Cuando un Circuito incorpora una parte de un Camino, conserva el vínculo con
ese Camino. Si luego se corrige el dibujo del Camino, el Circuito debe seguir
la línea corregida. La línea y el resumen permanente del Circuito reflejan la
información vigente antes de salir y en la copia descargada: navegar no
consulta internet. La decisión 047 reemplazó el aviso separado por ese
resumen siempre visible debajo del mapa.

Si el Circuito terminaba en la punta corregida del Camino, su final conserva
el lugar anterior, de acuerdo con la decisión posterior 048.

Corregir la línea de un Camino no cambia automáticamente su condición de paso,
complejidad, observación o fecha de comprobación. Esos datos se modifican solo
mediante una edición expresa, según la decisión 037.

## Alcance pendiente

La forma técnica de conservar los extremos de la parte incorporada cuando la
corrección cambia largo o cantidad de puntos requiere una propuesta y pruebas.
Si el Camino se retira, rige la decisión 045. Si una parte pasa a «sin paso»,
se refleja en la línea y el resumen de la decisión 047.

## Auditoría de fuentes

- **Leído en tiempo real:** decisión 034, decisión 037, plan de Mapas/Caminos/Circuitos y código de guardado de Caminos.
- **Decidido por Alejandro:** el Circuito sigue la corrección del Camino y avisa antes de salir.
- **Inferido:** para avisar antes de salir sin consultar internet en el cerro, el cambio debe detectarse y prepararse mientras hay señal.
- **Pendiente de verificación:** diseño del vínculo, aviso, actualización del paquete y pruebas con una corrección real.
