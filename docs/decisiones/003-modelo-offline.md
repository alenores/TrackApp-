# 003 — Modelo offline

**Fecha:** 2026-09-17 · **Estado:** 🟡 PARCIALMENTE CERRADA — actualizada 2026-09-18

## Contexto

Hay dos modelos posibles, y hay una referencia propia que funciona bien.

**Modelo actual de TrackApp:** se descarga de a un Track o de a un sector. Algunas
pantallas siguen yendo a internet aunque haya descarga hecha.

**Modelo de Vías de Escalada Córdoba:** se descarga un paquete único con todo, y
desde ahí las pantallas leen **solo** de lo guardado, nunca de internet. Descrito
en su glosario como *"funciona como un PDF descargado"*. Detecta novedades
comparando el último registro de cada tabla y ofrece actualizar.

## Cerrado el 2026-09-18

**La navegación es 100% sin conexión, sin excepciones.** El 99% de las salidas
se hacen sin señal. Navegar un track con el punto de GPS no consulta internet
nunca, por ningún motivo. No existe el caso especial: si un agente cree haberlo
encontrado, está equivocado.

**El usuario elige qué mapa descarga**, entre dos opciones:

1. **Mapa simple**, que siempre incluye curvas de nivel.
2. **Mapa satelital**, en la versión gratuita de 10 metros por píxel.

Todo lo que la navegación necesita se descarga antes de salir.

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

- Por Track o sector elegido, como ahora, pero con el resto del modelo corregido.
- Por zona geográfica, descargando una región completa de una vez.
- Automático alrededor de los Tracks marcados como favoritos.

**Esta decisión está abierta. No implementar nada de offline sin cerrarla.**

**Aclaración (2026-09-18):** ni siquiera está decidido que la app descargue
mapas. Eso depende de la definición funcional, que todavía no ocurrió. Nada de
lo escrito arriba da por sentada esa función.
