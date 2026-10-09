# 049 — Caminos y Circuitos reemplazan a Rutas; alturas y desnivel

**Decidido por Alejandro:** 2026-10-08 · **Estado:** las seis etapas implementadas y probadas en la app local; sin publicar

## Motivo

Caminos (en Mapas) y Circuitos ya cubren lo que hacía Rutas, y mejor: un
Camino es una posibilidad de paso clasificada por partes y un Circuito
planifica una salida. Rutas deja de usarse.

## Decisión

- **Rutas se retira por completo**: pantallas, avisos del inicio y descargas
  por Ruta. También se descarta el prototipo sin publicar de «partes de una
  ruta» (decisión 033). No se migra nada: la app arranca de cero.
- **Caminos** suma largo, desnivel positivo y desnivel negativo. Ningún otro
  dato de los que tenía Ruta.
- **Circuitos** suma largo total, desnivel positivo y negativo, técnica (1 a
  10, cargada a mano e independiente de los colores de los Caminos), nivel de
  esfuerzo (bajo, medio, alto o muy alto), qué llevar, complicaciones y
  comentario. «Qué llevar» reemplaza a «Equipo», porque «equipo» ya nombra a
  la bici o el kayak en «a pie con el equipo».
- **Largo, alturas y desnivel nunca se cargan a mano.** Ale importa todo de
  Google Earth, que no trae alturas: la app las averigua con el relieve del
  terreno al guardar (el mismo relieve de las curvas de nivel), en la
  computadora y con conexión. Son una estimación.
- **El desnivel del Circuito se mide sobre su propia línea y en su sentido**,
  no sumando los números de cada Camino: un Camino recorrido al revés invierte
  subida y bajada, y uno tomado en parte cuenta solo esa parte. El desnivel de
  un Camino se mide desde donde empieza su dibujo.
- **Gráfico de alturas** en la ficha de cada Camino y de cada Circuito. En el
  Circuito va pintado con los colores y marcas de los Caminos y diferencia lo
  dibujado solo para él. En la navegación de un Circuito se abre con un botón
  «Alturas», con la marca «Estás acá» y lo que falta hasta el final.
- **El resumen escrito del Circuito** (decisión 047) queda solo en la ficha.
- **El Circuito cruza sus mapas** como hacía Rutas: qué mapas toca, si están
  bajados y si en simple, satelital o los dos. Se avisa en el inicio y en la
  ficha, con señal.
- **Salidas** pasa a vincularse a un Circuito en lugar de una Ruta.

Boceto aprobado: `docs/bocetos/circuitos-datos-y-alturas.html`.

### Al retirar Rutas (respuestas de Ale del 2026-10-08)

- **El inicio pasa a ser la lista de Circuitos**, con el aviso de mapas que
  faltan arriba. El botón «Rutas» de la barra de abajo desaparece.
- **La navegación de un Circuito hace todo lo que hacía la de una Ruta**:
  registrar la Salida (que queda vinculada al Circuito), anotar desde el
  cerro, prender otros Circuitos sobre el mapa y todo lo demás que ya tenía.
- **La navegación libre queda con Caminos, puntos y trazos.** No suma
  Circuitos en lugar de las Rutas.
- **En cada zona, «Rutas en el mapa» pasa a «Circuitos en el mapa»**: los
  Circuitos que cruzan cada sector.

## Cómo se guardan las alturas

Cada Camino guarda una altura cada 25 m desde el comienzo de la línea, más una
en el final, y los dos desniveles. La línea dibujada no cambia: las alturas van
aparte, así corregir el dibujo sigue mostrando los mismos puntos. Para el
desnivel, un cambio cuenta recién cuando supera 3 m: sin eso, las ondulaciones
mínimas del relieve se suman como cuestas.

Si la línea cambia, las alturas se vuelven a medir en el mismo guardado. Si el
relieve no contesta, no se guarda nada y el cartel dice por qué. La base exige
que las tres columnas vayan juntas y que la cantidad de alturas coincida con el
largo, y borra las alturas si alguien cambia la línea sin recalcularlas.

En el celular, las alturas viajan con la línea en el depósito grande, no en el
paquete liviano.

## Etapas

1. Alturas, largo y desnivel de Caminos, con su gráfico en la ficha. **Hecha.**
2. Datos del Circuito: totales calculados y datos cargados a mano. **Hecha.**
3. Gráfico del Circuito en la ficha y en la navegación («Alturas», con
   «Estás acá» y lo que falta hasta el final). **Hecha.**
4. Circuito y mapas bajados: la ficha dice qué sectores cruza y si cada uno
   está en simple, satelital o los dos; la lista de Circuitos avisa los mapas
   perdidos y los Circuitos que nunca tuvieron su mapa. **Hecha.** Los
   sectores se cuentan sobre la línea de verdad, no sobre su rectángulo.
5. Salidas vinculadas a Circuitos: la Salida registrada navegando guarda el
   Circuito (`salidas.circuito_id`) y arranca con su actividad. Un registro
   empezado antes en algún celular sube igual, con su ruta. **Hecha.**
6. Retiro de Rutas. **Hecha.** El inicio es la lista de Circuitos; la barra y
   el menú ya no tienen Rutas; la navegación del Circuito registra la Salida,
   anota y prende otros Circuitos («Circuitos en el mapa»); la navegación libre
   quedó con Caminos, puntos y trazos; en cada zona, «Circuitos en el mapa».
   La puesta al día dejó de bajar Rutas y borra del celular sus líneas viejas.
   Las direcciones viejas (`/rutas`, `/navegacion/…`) llevan al inicio. La
   tabla `rutas` queda en la base sin uso. Se conservan las piezas compartidas
   que vivían en carpetas de Rutas (actividades, lectura de archivos GPS,
   indicadores de técnica y esfuerzo, referencia de colores, bloque de mapas).

## Encontrado en el camino

- Las líneas de Google Earth traen un tercer número, la altura, siempre en
  cero. El Camino lo guardaba y un Circuito sobre ese Camino no se podía
  guardar («Un punto del Circuito está fuera del mapa»). Ahora el Camino guarda
  solo longitud y latitud; hay una prueba que lo cubre.
- El aviso de mapas perdidos y nunca bajados dejó de mostrarse el 2026-09-23,
  al sumar porcentajes en las tarjetas de Rutas. Volvió en la lista de
  Circuitos.

## Auditoría de fuentes

- **Leído en tiempo real:** esquema de la base, decisiones 011, 013, 033, 034
  y 047, glosario, archivo del relieve y su puente.
- **Decidido por Alejandro:** todo lo listado en «Decisión», en la conversación
  del 2026-10-08, y el boceto aprobado.
- **Verificado:** una línea real de Los Gigantes dio alturas entre 1.760 y
  1.856 m, con 204 m de desnivel positivo y 151 m de negativo.
- **Verificado en la app:** Camino y Circuito de prueba importados y armados
  desde las pantallas; ficha, gráfico, datos, mapas para salir y aviso de la
  lista; modo sol y noche.
- **Verificado en la app (etapas 5 y 6):** inicio con Circuitos, navegación con
  todos sus botones, pregunta de registrar, Salida subida como borrador con su
  Circuito, «Circuitos en el mapa» al navegar y en la zona, navegación libre
  sin Rutas, puesta al día completa sin Rutas.
- **Pendiente de verificación:** con GPS real y en modo avión en un celular:
  «Estás acá», registro con puntos y anotaciones; la redirección de las
  direcciones viejas (necesita reiniciar el servidor o publicar).
