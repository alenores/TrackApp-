# 014 — Navegar sin mapa: se avisa, no se bloquea

> Decidido: 2026-09-19 · Decide: Ale

## La pregunta

Cuando una ruta pasa por un sector cuyo mapa no está descargado, y el usuario
aprieta «Navegar»:

- **Opción A)** La app deja navegar igual, con un cartel fijo en pantalla que
  dice que ese pedazo va sin mapa (el punto azul se ve, el fondo no).
- **Opción B)** La app no deja arrancar y manda a bajar ese mapa primero.

## La decisión: opción A

**Se navega igual. Con el cartel a la vista, siempre.**

## Por qué

Bloquear la navegación castiga a alguien que ya está en el cerro, donde el
bloqueo no le sirve de nada: no puede bajar el mapa porque no tiene señal. La
opción B convierte un problema menor en uno grave.

Y sin mapa la navegación **igual funciona**, porque no depende del mapa:

- la línea de la ruta se dibuja sola, con lo guardado en el celular;
- el punto del GPS también, porque el GPS es satélite y no necesita señal;
- el aviso de desvío se calcula contra la línea, no contra el mapa.

Lo único que falta es el fondo. Eso es peor que tenerlo, pero es
incomparablemente mejor que no poder navegar.

## Lo que sí es obligatorio

El cartel. **Una pantalla que muestra la línea sin fondo y no explica por qué
es peligrosa**, porque el usuario puede creer que está viendo un mapa vacío en
vez de un mapa que falta.

El cartel dice, según el caso:

- que todavía no hay mapas cargados en la app;
- cuántos kilómetros de la ruta caen fuera de todo sector;
- qué sector le falta bajar, por nombre.

Cuando hay hueco **y** falta descargar, gana el hueco: es lo más grave, porque
no se arregla bajando nada.

## Lo que esto no cambia

Sigue valiendo entero que **todo se sabe en casa**. El mismo aviso aparece
antes, con señal: en la ficha de la ruta y al subirla. La opción A no es una
excusa para avisar tarde; es qué hacer cuando el usuario igual salió.

## Auditoría de fuentes

**Leído en tiempo real:**
- `lib/cobertura.ts`, `lib/navegacion/aviso-de-mapa.ts`,
  `components/navigation/navegacion-view.tsx`,
  `components/rutas/bloque-de-cobertura.tsx`, `components/mapa/capas-base.ts`.

**Inferido (no verificado):** nada.

**Pendiente de verificación:** nada.
