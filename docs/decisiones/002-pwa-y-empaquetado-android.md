# 002 — PWA ahora, empaquetado Android al final

**Fecha:** 2026-09-17 · **Estado:** vigente

## Contexto

TrackApp es una app web instalable. Se evaluó hacer apps nativas separadas para
Android y iPhone.

## Decisión

**La app sigue siendo web instalable. El desarrollo se enfoca 100% en eso.**

Al final, y solo si no se complica, se empaqueta para Android con el único fin de
conseguir GPS en segundo plano. **Es opcional y descartable**: si se pone
riesgoso, se abandona sin costo.

**iPhone queda descartado.**

## Motivos

- **Nativo por separado** obligaría a mantener tres códigos en vez de uno, para
  una app de uso personal entre amigos.
- **iPhone exige una Mac** para compilar y publicar, y 99 dólares por año aun sin
  publicar en la tienda. Ale trabaja en Windows y no tiene iPhone para probar.
- **Android no exige nada de eso**: se puede repartir el archivo de instalación
  directamente, sin tienda y sin costo.
- **No se va a publicar en tiendas.** La app es para Ale y sus amigos.

## Consecuencia para el desarrollo diario

Ninguna tarea dedicada. Solo dos cuidados mientras se desarrolla: no depender de
comportamientos exclusivos de una pestaña de navegador, y mantener la lógica del
botón atrás limpia.

## Pendiente de verificación

Google anunció cambios que exigirían identificación del desarrollador incluso
para apps instaladas fuera de la tienda. **Verificar antes de empaquetar.**
