# 009 — Cobertura de mapas de una ruta

**Fecha:** 2026-09-18 · **Estado:** vigente

## Qué resuelve

El usuario abre una ruta y tiene que saber, **ahí mismo y con señal**, qué mapas
necesita para recorrerlo sin conexión. Sin ir a buscarlos a otra pantalla y sin
dibujar nada a mano.

## Cómo funciona

**La ruta manda, los sectores responden.** El sistema cruza la línea de la ruta
contra los rectángulos de todos los sectores y determina por cuáles pasa. **El
usuario no marca nada.**

Una ruta puede cruzar uno, dos o muchos sectores.

## Los tres estados

La pantalla de la ruta muestra, **tramo por tramo**, en cuál de estos tres
estados está:

| Estado | Qué significa |
|---|---|
| **Cubierto y descargado** | Hay sector para ese tramo y ya está en el celular |
| **Cubierto, sin descargar** | Hay sector para ese tramo, falta bajarlo |
| **Sin cobertura** | Ningún sector cubre ese tramo. No hay mapa disponible |

**No alcanza con «descargado / no descargado».** Una ruta que cruza tres
sectores con dos bajados no está ni descargado ni sin descargar: está incompleto,
y hay que decir exactamente qué falta.

**El tercer estado es obligatorio y no se esconde.** Si el trayecto pasa por
territorio que ningún sector cubre, se dice. Ese tramo se va a recorrer sin mapa
y el usuario tiene que saberlo antes de salir, no al llegar ahí.

## La cobertura se mira desde dos lados

Es el mismo concepto visto de dos maneras, y las dos existen:

| Desde | Pregunta que responde | Para quién |
|---|---|---|
| **Una ruta** | ¿Qué sectores necesito bajar para recorrerla? | Cualquier usuario |
| **Una zona** | ¿Qué parte de este territorio todavía no tiene sector? | Solo el administrador |

La segunda se documenta en `011-datos-de-rutas-zonas-y-sectores.md`.

## Regla que lo gobierna

Todo esto existe por una sola razón: **el usuario se entera en su casa, con
señal.** Ver la regla «Todo se sabe en casa» en `AGENTS.md`.

## Qué pasa cuando un tramo no tiene cobertura

**Se avisa. Nada más.** (Decidido por Ale, 2026-09-18.)

- **No se le ofrece al usuario crear el sector que falta.** Ni siquiera al
  premium. Cargar zonas y sectores, y descargar sus mapas, es tarea exclusiva
  del administrador mientras el producto sea chico.
- **No se construye ninguna funcionalidad de administración de tramos sin
  cobertura.** Ni listado, ni aviso al administrador, ni panel, ni nada.
  Ale lo ve como cualquier otro usuario, mirando la ruta.
- **Prohibido a los agentes proponer funcionalidad alrededor de esto.** El
  faltante se avisa en la pantalla de la ruta y ahí termina el tema.

El aviso alcanza. Nada más.

## Pendiente

- Cómo se presenta visualmente. Va con el mockup de esa pantalla.
