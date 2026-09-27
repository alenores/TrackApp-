# 026 — Señal que sirve, no red enganchada

**Fecha:** 2026-09-27 · **Estado:** vigente
**Aplica a:** toda la app. Lo que se hace con señal y sin señal no cambia; cambia
cuándo la app se da cuenta de que no hay.

---

## El problema: el gris

Con una rayita de cobertura, el teléfono dice que hay red aunque no pase nada por
ahí. La app le creía: mostraba los botones que necesitan señal —bajar mapas,
subir una ruta, crear un sector— y al tocarlos fallaban; la puesta al día y la
subida de anotaciones quedaban esperando minutos. Con modo avión, en cambio, el
teléfono dice que no hay red y el modo sin señal anda perfecto.

Es el mismo problema que se resolvió en Vías de Escalada el mismo día.

## Decisión

- **Un detector central** (`lib/conexion.ts`). `hayConexion()` da «no» si no hay
  red **o** si hay red pero nuestro servidor no responde a tiempo. **Señal débil
  = sin señal**, exactamente el modo de siempre. No hay un tercer modo.
- **La prueba:** un pedido a `/api/senal` (respuesta vacía, nunca guardada) con
  tope de 4 segundos. Para declarar señal débil tiene que fallar **dos veces
  seguidas**; para volver alcanza con una respuesta a tiempo.
- **Cuándo se prueba:** al abrir la app, al volver a ella, cuando el teléfono
  avisa que volvió la red y cuando un pedido a la base tarda o falla. Con señal
  débil se vuelve a probar sola cada 20 segundos. Entre pruebas disparadas por
  fallas, 10 segundos de pausa.
- **Mientras no se sabe, no hay.** Es la regla de siempre de la app. Al abrir con
  señal buena, la prueba contesta en décimas de segundo. La puesta al día del
  arranque **espera** esa primera prueba, para no arrancar siempre como «sin
  señal».
- **Nunca se prueba con la navegación abierta** (ni navegar una ruta ni el mapa
  libre). La prueba es un pedido a internet, y navegar no consulta internet por
  ningún motivo.
- **Tope de 15 segundos a todo pedido a la base**, salvo las subidas de fotos. Al
  vencer, el pedido falla con el motivo y dispara la prueba.
- **Motor offline:** la prueba tiene su regla propia, primera de la lista, que va
  siempre a internet. Sin ella caía en la regla de `/api/` que trae la librería
  (10 s de espera y copia guardada de respaldo), y con señal débil contestaría lo
  guardado: la app creería que hay señal justo cuando no la hay.
- **Control de sesión:** la prueba no pasa por él. Tiene que contestar al toque.
- **Bajar un mapa que pidió el usuario no se frena por el detector.** Sus pedidos
  fallan solos si no hay señal.
- **Cartel de la falla:** suma «Señal que sirve», con «no: señal débil» cuando es
  el gris.

## Qué no se hizo

- No hay tabla de informes de falla en esta app, así que no se anota la señal
  débil en ningún lado (en Vías sí).
- No se cambió qué se muestra sin señal ni cómo.

## Referencia

Vías de Escalada Córdoba, `lib/conexion.ts` y su regla `/api/senal`.
