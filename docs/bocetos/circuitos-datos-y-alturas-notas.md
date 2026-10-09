# Boceto de datos y alturas de Circuitos y Caminos: notas

**Estado:** aprobado por Alejandro el 2026-10-08 («sirve el orden… confirmado»),
con «Qué llevar» y el lugar del botón «Alturas». Es un ejemplo local: no lee
datos ni guarda nada. Ver decisión 049.

## Qué decidió Ale antes del boceto (2026-10-08)

- **Rutas se retira por completo.** Caminos y Circuitos la reemplazan. Se
  descarta también el prototipo sin publicar de «partes de una ruta». No se
  migra nada: la app arranca de cero.
- **Caminos** suma largo, desnivel positivo y desnivel negativo. Nada más de
  lo que tenía Ruta.
- **Circuitos** suma largo total, desnivel positivo y negativo, técnica (1 a
  10, a mano e independiente de los colores de los Caminos), nivel de
  esfuerzo (bajo, medio, alto o muy alto, a mano), qué llevar, complicaciones
  y comentario.
- **Largo y desnivel nunca se cargan a mano.** Ale importa todo desde Google
  Earth, que no trae alturas: la app las averigua con el relieve del terreno
  al guardar, con internet. Son una estimación.
- **El desnivel del Circuito se mide sobre su propia línea y en su sentido**,
  no sumando los números de cada Camino. El de un Camino se mide desde donde
  empieza su dibujo; al revés se invierten.
- **El Circuito cruza sus mapas** igual que hacía Rutas: qué mapas toca, si
  están bajados y si en simple, satelital o los dos. Se avisa en el inicio y en
  la ficha, con señal.
- **Salidas** pasa a vincularse a un Circuito en lugar de una Ruta.
- **Gráfico de alturas** en la ficha de cada Camino y de cada Circuito. En el
  Circuito va pintado con los colores y marcas de los Caminos. También está
  durante la navegación, detrás de un botón, con la marca «Estás acá».
- **El resumen escrito del Circuito** queda solo en la ficha, no en la
  navegación.
- La información de los Caminos es la última bajada al celular: con señal se
  pone al día al abrir la app; la navegación no sale a internet.

## Qué se puede probar

1. Pasar el mouse por un gráfico: la altura y la distancia se leen arriba y el
   punto se marca en el mapa.
2. «Navegando» → «Alturas»: se abre el panel con «Estás acá» y lo que falta
   hasta el final. «Cerrar» lo cierra.
3. El botón de modo cambia sol y noche en todas las pantallas.

## Preguntas que tenía el boceto (respondidas: sí a las tres)

- Orden de la ficha del Circuito.
- Nombre «Qué llevar» en lugar de «Equipo».
- Lugar del botón «Alturas» en la navegación.

## Límites de la demostración

Mapa, línea y alturas son inventados. Los números sí salen de esa línea y esas
alturas, así que coinciden entre sí. La ficha del Camino toma un pedazo de la
misma línea de ejemplo. La fuente real de alturas y su precisión se
comprueban al implementar.

## Auditoría de fuentes

- **Leído en tiempo real:** esquema actual de la base (caminos, circuitos,
  rutas, salidas, mapas bajados), decisiones 011, 013, 033, 034 y 047,
  glosario, resumen actual del Circuito, boceto anterior de Circuitos.
- **Decidido por Alejandro:** todo lo listado arriba, en la conversación del
  2026-10-08.
- **Pendiente de verificación:** precisión de las alturas sobre Caminos reales.
