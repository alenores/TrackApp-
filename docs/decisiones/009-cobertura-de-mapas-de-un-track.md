# 009 — Cobertura de mapas de un track

**Fecha:** 2026-09-18 · **Estado:** vigente

## Qué resuelve

El usuario abre un track y tiene que saber, **ahí mismo y con señal**, qué mapas
necesita para recorrerlo sin conexión. Sin ir a buscarlos a otra pantalla y sin
dibujar nada a mano.

## Cómo funciona

**El track manda, los sectores responden.** El sistema cruza la línea del track
contra los rectángulos de todos los sectores y determina por cuáles pasa. **El
usuario no marca nada.**

Un track puede cruzar uno, dos o muchos sectores.

## Los tres estados

La pantalla del track muestra, **tramo por tramo**, en cuál de estos tres
estados está:

| Estado | Qué significa |
|---|---|
| **Cubierto y descargado** | Hay sector para ese tramo y ya está en el celular |
| **Cubierto, sin descargar** | Hay sector para ese tramo, falta bajarlo |
| **Sin cobertura** | Ningún sector cubre ese tramo. No hay mapa disponible |

**No alcanza con «descargado / no descargado».** Un track que cruza tres
sectores con dos bajados no está ni descargado ni sin descargar: está incompleto,
y hay que decir exactamente qué falta.

**El tercer estado es obligatorio y no se esconde.** Si el trayecto pasa por
territorio que ningún sector cubre, se dice. Ese tramo se va a recorrer sin mapa
y el usuario tiene que saberlo antes de salir, no al llegar ahí.

## Regla que lo gobierna

Todo esto existe por una sola razón: **el usuario se entera en su casa, con
señal.** Ver la regla «Todo se sabe en casa» en `AGENTS.md`.

## Qué pasa cuando un tramo no tiene cobertura

**Se avisa. Nada más.** (Decidido por Ale, 2026-09-18.)

- **No se le ofrece al usuario crear el sector que falta.** Ni siquiera al
  premium. Cargar zonas y sectores, y descargar sus mapas, es tarea exclusiva
  del administrador mientras el producto sea chico.
- **Ale sí quiere enterarse** de que ese tramo quedó sin cobertura.

### Nota técnica que simplifica esto

El faltante **se puede detectar en el momento en que se sube el track**, no
recién cuando alguien intenta usarlo. El cruce contra los sectores es un cálculo,
no depende de que un usuario llegue ahí ni de que reporte nada.

Es decir: el administrador puede tener la lista de tramos sin cobertura sin que
ningún usuario tenga que avisar nada.

## Pendiente

- **Cómo se entera Ale.** Decisión funcional no tomada.
- Cómo se presenta visualmente. Va con el mockup de esa pantalla.
