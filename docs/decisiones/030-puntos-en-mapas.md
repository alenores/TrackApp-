# 030 — Gestionar puntos en Mapas

**Decidido:** 2026-10-01 · **Mockup aprobado por Ale**

## Decisión

Mapas incorpora una tercera pestaña, **Puntos**, visible solo para el
administrador, de acuerdo con la decisión 027. Allí se ven todos los puntos
marcados en el mapa general de Córdoba y en una lista debajo del mapa. El mapa
conserva el mismo alto que la pestaña **Mapa** y la lista aparece al desplazarse.

La lista permite filtrar por zona o sector y por tipo de ícono. Cada punto
muestra su comentario o, si no tiene, el nombre del ícono, junto con su zona y
sector cuando se pueden determinar. El botón **Agregar un punto** abre el
formulario existente; tocar un punto de la lista o del mapa permite editarlo.
Guardar y borrar mantienen las reglas de la decisión 027. El acceso anterior
`/zonas/puntos` lleva a esta pestaña con `vista=puntos`.

La pestaña **Mapa** y el mapa de **Puntos** usan el doble del alto habitual en
celular y escritorio; en ventanas grandes conservan el alto disponible de la
pantalla.

## Motivo

La lista y el mapa juntos permiten encontrar un punto por su ubicación o por
su información. Mantener el mismo encuadre de Córdoba conserva el contexto
general y deja el listado accesible al desplazarse.

## Auditoría de fuentes

- Leído en tiempo real: mockup aprobado por Ale, pantalla Mapas, administración
  actual de puntos y decisiones 027 y 029.
- Inferido: cuando un punto no tiene sector asignado, su zona y sector se
  determinan por la ubicación geográfica si cae dentro de sus límites.
- Pendiente de verificación: revisión de la pantalla publicada en distintos
  tamaños de celular después del despliegue.
