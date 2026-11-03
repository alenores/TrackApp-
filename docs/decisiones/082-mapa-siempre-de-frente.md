# 082 — Mapa siempre de frente

**Fecha:** 2026-11-03 · **Estado:** vigente · Decisión de Ale.

## Problema

En el celular se podía inclinar el mapa con dos dedos. En la PC no. Quedaban
dos comportamientos distintos para la misma app.

Inclinar o girar un mapa de fotos planas no da la vista de Google Earth: solo
mueve la imagen de costado y, al navegar, complica ubicarse.

## Decisión

- El mapa queda **siempre de frente**, sin inclinación ni giro.
- **Igual en celular y en PC.** No hay un gesto en uno que falte en el otro.
- Para mirar el terreno de costado o en profundidad se usa **Google Earth**,
  que es la herramienta profesional para eso. TrackApp no lo imita.

## Auditoría de fuentes

- Leído en tiempo real: pedido de Ale; opciones del mapa compartido
  (`dragRotate`, `touchPitch`, `maxPitch`, giro con dedos y teclado).
- Inferido: ninguno.
- Pendiente de verificación: que Ale lo pruebe en el celular (dos dedos) y en
  la PC (mouse).
