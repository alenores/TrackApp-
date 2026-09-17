# 003 — Modelo offline

**Fecha:** 2026-09-17 · **Estado:** 🟡 ABIERTA — falta decidir

## Contexto

Hay dos modelos posibles, y hay una referencia propia que funciona bien.

**Modelo actual de TrackApp:** se descarga de a una ruta o de a un sector. Algunas
pantallas siguen yendo a internet aunque haya descarga hecha.

**Modelo de Vías de Escalada Córdoba:** se descarga un paquete único con todo, y
desde ahí las pantallas leen **solo** de lo guardado, nunca de internet. Descrito
en su glosario como *"funciona como un PDF descargado"*. Detecta novedades
comparando el último registro de cada tabla y ofrece actualizar.

## Lo que sí está decidido

- **Las pantallas leen de lo guardado, nunca de internet.** Internet solo sirve
  para actualizar lo guardado. Esta regla se adopta tal cual.
- **Detección de novedades** al estilo Vías de Escalada.
- **Nunca decir «listo»** sobre una descarga que quedó incompleta.

## Lo que falta decidir

El paquete único completo **no se puede copiar tal cual**: lo pesado de TrackApp
son las imágenes del mapa, y bajar todo el mapa de Córdoba no entra en un celular.

Hay que definir el criterio de qué mapa se descarga y cuándo. Opciones a evaluar
cuando se retome el tema:

- Por ruta o sector elegido, como ahora, pero con el resto del modelo corregido.
- Por zona geográfica, descargando una región completa de una vez.
- Automático alrededor de las rutas marcadas como favoritas.

**Esta decisión está abierta. No implementar nada de offline sin cerrarla.**
