# 080 — Google guardado mientras Google lo permite

**Fecha:** 2026-10-31 · **Estado:** vigente · **Riesgo asumido por Ale**

## Decisión de Ale

Lo que se mira de Google en **Consultas, con señal**, queda guardado en el
celular **solo el tiempo que Google indica en cada imagen**. Mientras vale, las
dos navegaciones lo dibujan **encima del mapa bajado** (simple o satelital).

- **No reemplaza al mapa bajado ni genera sorpresas:** donde no hay imagen de
  Google, o ya venció, se ve el mapa de siempre. Se goza de más o menos
  detalle según lo que haya. No se avisa nada.
- **Nunca se guarda más tiempo que el que dice Google.** Si Google dice que no
  se guarde, o no dice por cuánto, no se guarda. Guardarla más sería
  malintencionado y fácil de detectar (Ale).
- Uso de Ale: recorre en Consultas antes de salir y navega dentro de las horas
  siguientes. No hace falta explicárselo.

## Riesgo asumido

Las reglas de Google restringen el uso sin conexión y el uso junto a mapas que
no son de Google (ver decisión 079 y la conversación del 2026-10-31). Ale lo
asume: es una app de pocos usuarios y, **si Google lo objeta, se apaga**.

**Cómo se apaga:** sacar la capa «Google guardado» del mapa y volver Consultas
a pedir la imagen directo. Está todo junto, en la parte de la app que guarda
las imágenes de Google y en su capa del mapa.

## Cómo funciona

- Las consultas con señal reutilizan las imágenes vigentes mediante el servicio
  común (decisión 083, aprobada por Ale el 2026-11-18). Si falta la imagen o
  venció, la piden por el servidor, que pasa los metadatos de vigencia de Google.
- El celular la muestra y, si Google lo permite, la guarda con su vencimiento
  original, que nunca se prolonga al reutilizarla.
- Navegando, la capa «Google guardado» lee solo del celular. Una imagen vencida
  no se muestra y se borra. Al abrir el mapa se borran todas las vencidas.
- Va encima del terreno, de la foto propia y del sombreado, y debajo de
  arroyos, senderos, caminos y nombres. Lleva el mismo velo que la foto propia
  para que las curvas se lean.
- Cerrar sesión borra todas.
