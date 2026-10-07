# 036 — Actividades de cada Camino

**Decidido por Alejandro:** 2026-10-05 · **Estado:** definición de producto; pendiente de implementación

## Decisión

Cada Camino debe indicar para qué actividades sirve. Se elige **al menos una**
actividad obligatoriamente y se pueden elegir varias para el mismo Camino.
La actividad no queda definida únicamente en el Circuito.

Se usa exactamente la lista de actividades que ya existe en la app:
**Trekking, Correr, Mountain bike, Kayak y Canyoning**. No se crea otra
categoría llamada «Vehículos».

La condición de paso y la complejidad local de **cada parte** se clasifican
**por actividad**. Así, una misma parte puede tener valores diferentes para
Mountain bike y Trekking, por ejemplo. Una misma línea del mapa sirve para
distintas formas de desplazarse sin duplicarse por cada actividad.
La observación y la fecha de comprobación son únicas para la parte y se
comparten entre actividades (decisión 038).

## Presentación en el mapa

Ale decidió que la persona elige una **actividad principal** para ver el mapa:

- Se siguen viendo **todos** los Caminos; la actividad elegida no filtra ni
  oculta los de otras actividades.
- Los Caminos aptos para la actividad elegida muestran la condición de paso y
  complejidad propias de esa actividad.
- Un Camino que sirve para varias muestra la clasificación de la actividad
  elegida. Al tocarlo se pueden consultar las demás actividades y sus datos.
- Los Caminos que solo sirven para otras actividades se muestran con menos
  protagonismo, pero siguen claramente visibles y se pueden tocar. El efecto
  visual concreto debe funcionar con sol y de noche; no se presupone un color
  fijo ni se los confunde con una clasificación todavía desconocida.

**Pendiente:** cómo se completa una actividad que aún no se evaluó y cuál es
la presentación concreta en sol y noche.

La **actividad principal la elige cada persona en el mapa**. La app recuerda
su última elección para la próxima vez que abra el mapa. Si todavía no eligió
ninguna, debe poder elegir una; la actividad inicial antes de esa elección no
se deduce de su perfil sin una decisión adicional.

## Estado de implementación

La app todavía guarda «Rutas» bajo la estructura anterior. No se cambió código
ni base por esta decisión.

## Auditoría de fuentes

- **Leído en tiempo real:** plan de Mapas/Caminos/Circuitos y glosario.
- **Decidido por Alejandro:** cada Camino admite una o más actividades, con
  una como mínimo obligatoria; condición y complejidad local son propias de
  cada actividad en cada parte. Todos los Caminos siguen visibles en el mapa,
  con prioridad visual para la actividad elegida. Cada persona elige su
  actividad principal en el mapa y la app recuerda la última elección.
- **Leído en el código actual:** `types/database.ts` y
  `lib/rutas/actividades.ts` contienen las cinco actividades y sus nombres
  visibles.
- **Pendiente de verificación:** presentación de una actividad aún no evaluada,
  diseño concreto en sol/noche, implementación y pruebas.
