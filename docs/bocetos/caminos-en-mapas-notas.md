# Boceto de Caminos en Mapas: notas

**Estado:** aprobado por Ale el 2026-10-06 para implementar Mapas/Caminos.
El boceto no cambia la app por sí mismo. Ale lo revisó abierto en el navegador,
dijo que lo ve bien y autorizó seguir. Codex revisó la lógica estática del
boceto y coincide con la dirección de producto; no pudo verificar visualmente
ese archivo por la restricción del navegador automatizado.
Preparado el 2026-10-06 y corregido el mismo día después de la revisión de
Codex (ver «Correcciones» al final).

## Cómo verlo

Abrí el archivo HTML de esta misma carpeta con doble clic: se abre en el
navegador, sin internet y sin conectarse a nada.

- La franja de arriba, con borde punteado, **no es la app**. Sirve para saltar
  entre las situaciones, ver la pantalla como Administrador, como el Premium
  que subió el Camino, como otro Premium o como Normal, y para reiniciar el
  ejemplo.
- El botón «Cambiar a modo sol / noche» está arriba a la derecha, como en la app.
- Los recuadros con borde punteado que dicen «Nota del boceto» son explicaciones
  para vos: no van en la app.
- La tecla Escape hace lo mismo que el botón de atrás del celular: cierra la
  confirmación o el mapa agrandado.

## Qué se ve

1. **Mapa general.** Caminos, puntos y trazos sobre el mapa, con la zona
   marcada solo por su borde y su nombre. Arriba se elige la actividad
   principal. Los Caminos de esa actividad se ven con su color y su forma de
   línea; los que sirven para otras actividades quedan finos y grises, pero se
   pueden tocar. Tocar un Camino abre su ficha al costado del mapa, con los
   datos de la parte tocada para cada actividad, la observación y la fecha.
   Tocar un punto o un trazo muestra quién lo marcó y, a quien puede, «Editar»
   y «Borrar». Alejado no hay nombres sobre el mapa; con «+» se acerca al
   Camino elegido y aparecen los nombres y los íconos.
2. **Traer de afuera, con tu archivo de Ascochinga.** Siete líneas por
   separado, cada una con su largo real: ninguna se suma a otra. **El archivo
   no trae puntos y así se muestra.** Ninguna línea viene decidida: para cada
   una se elige Camino, Trazo de referencia u Omitir. Un trazo pide además su
   color. Los Caminos nuevos piden al menos una actividad. Hasta que esté todo
   decidido, «Sumar al mapa» no se activa y el resumen dice qué falta. Queda
   dicho que el archivo no se guarda.
3. **2b · Archivo con puntos (ejemplo).** Un archivo **inventado**, aparte del
   de Ascochinga, que trae solo tres puntos. Para cada punto se elige sumarlo u
   omitirlo, y se puede cambiar el ícono. No pide actividades porque no hay
   Caminos. El resumen y el resultado cuentan los puntos («Vas a sumar 2
   puntos. Se omite 1 punto.»), y se puede completar sin ninguna línea. Si se
   omite todo, avisa que no queda nada para sumar.
4. **Editor del Camino.** Nombre, descripción y actividades, con los topes a la
   vista: 120, 2.000 y 1.000 **caracteres**, contados como los cuenta la base
   (un emoji es un carácter). «Corregir la línea» deja mover los puntos del
   dibujo: es el mismo Camino y cada parte conserva su condición, complejidad,
   observación y fecha. «Retirar este Camino» pide confirmación.
5. **Editor de partes.** Se elige la actividad y la parte (tocándola en el mapa
   o en la lista). Condición y complejidad son de esa actividad; las de las
   otras actividades se leen al lado. Una parte «sin paso» lleva X y conserva
   su color. La observación y la fecha son de la parte, para todas las
   actividades; cambiarlas no cambia la línea ni la condición. Una fecha
   posterior a hoy no se puede guardar. «Partir una parte» pide dos toques
   sobre la línea, inicio y final.
6. **Pestaña Anotaciones.** La ven todos. Administrador y Premium suman puntos
   y trazos (a mano o trayendo un archivo); Premium cambia y borra solo lo
   suyo, el Administrador cualquiera. Normal la abre solo para mirar: sin
   botones de sumar, editar ni borrar, con un aviso una sola vez arriba.
7. **Permisos y estados.** Una página solo del boceto que junta quién puede
   hacer qué —Caminos, puntos y trazos— y cómo se ven la lista vacía, la carga
   y cada error, siempre con el motivo y qué hacer.

## Decisiones visuales aprobadas con el boceto

Estas soluciones estaban propuestas al presentar el boceto y quedan aprobadas
con la revisión de Ale del 2026-10-06. Los límites del ejemplo que figuran más
abajo no son comportamiento aprobado para la app terminada.

1. **Una pestaña nueva, «Caminos», dentro de Mapas**, entre Mapa y Anotaciones.
   La ven todos; «Traer de afuera» y «Editar» solo aparecen a quien puede
   usarlos.
2. **«Traer de afuera»** en vez de «importar», porque ya es la palabra del
   glosario para sumar cosas desde un archivo de Google Earth. El botón final
   dice «Sumar al mapa».
3. **Los Caminos de otras actividades se ven finos, grises y sin forma de
   condición.** Así no se confunden con una parte «sin clasificar», que se ve
   gruesa y gris claro.
4. **Cada línea de un Camino lleva un borde oscuro en modo sol.** Sin ese
   borde, el amarillo de «media» no llega al contraste mínimo sobre el mapa
   claro. Con el borde, el color puede seguir siendo amarillo de verdad.
5. **«A pie» cambia de nombre según la actividad:** «A pie con la bici» en
   Mountain bike, «A pie con el kayak» en Kayak y «A pie con equipo» en las
   demás.
6. **La ficha de un Camino va al costado del mapa**, no encima, así no tapa
   nada. Los únicos botones sobre el mapa son «+», «−» y «Agrandar», abajo a la
   derecha.
7. **En «Traer de afuera», las actividades se eligen una sola vez** para todos
   los Caminos nuevos del archivo. Después se cambian en cada Camino.
8. **Un punto que viene en el archivo** lleva el ícono que corresponde por su
   nombre («Mirador…» → mirador), como ya hace la app, y se puede cambiar. Lo
   que dice el archivo queda como comentario del punto.
9. **El editor tiene dos pestañas:** «Datos y línea» y «Partes».
10. **Corregir la línea es arrastrar sus puntos.** Cómo se suma o se saca un
    punto del dibujo queda para cuando se construya el editor.
11. **Sacar una actividad pide confirmación**, porque borra su condición y su
    complejidad en todas las partes. La observación y la fecha quedan.
12. **La pestaña Anotaciones también la ve Normal, solo para mirar.** La
    decisión de permisos dice que Normal consulta; mostrarle la pestaña es mi
    propuesta. La otra opción es no mostrársela.
13. **«Volver» desde «Traer de afuera» regresa a la pestaña de donde viniste**:
    a Caminos si entraste desde ahí, a Anotaciones si entraste desde ahí.

## Lo que en el boceto no es real

- **No guarda nada.** Al recargar la página vuelve a empezar.
- **No lee archivos.** Las siete líneas de Ascochinga se dibujaron una sola vez
  a partir del archivo; «Elegir otro archivo» no hace nada.
- **El archivo «Puntos del cerro» es inventado**, solo para mostrar cómo se
  trae un archivo con puntos. No es tuyo.
- **Los datos son de ejemplo:** qué actividades tiene cada Camino, sus
  clasificaciones, observaciones, quién subió cada cosa (Martín, Sofía y Juan
  son inventados), la zona «Sierras Chicas», los puntos y los trazos.
- **El fondo del mapa es un dibujo simple**, no el mapa simple ni el satelital.
- **«Hoy» es el 6 de octubre de 2026**, fijo, para probar la fecha futura.
- **Las partes se cortan en los puntos de la línea.** En la app se va a cortar
  exactamente donde se toque, también entre dos puntos.
- **Retirar un Camino o borrar un punto o un trazo lo saca solo de esta
  página.** Para volver a verlo está «Reiniciar el boceto», que no existe en la
  app: retirar un Camino no se puede deshacer.
- **Sumar al mapa no cambia el mapa general del boceto**: muestra siempre el
  mismo ejemplo.
- **«Sumar un punto», «Sumar un trazo», «Editar» en puntos y trazos, «Ver
  zona», «Probar de nuevo» y los demás botones de error** no hacen nada: están
  para ver dónde van y cómo se leen.
- **La actividad principal no se recuerda** al cerrar el boceto; en la app sí.
- **Corregir la línea no cambia el mapa general del boceto**, aunque la
  clasificación sí se ve en los dos lugares.

## Observaciones técnicas (no se arreglaron en esta tarea)

- El amarillo de «media» del prototipo, en modo sol, queda en 4,2 a 1 contra
  el fondo del mapa, por debajo del mínimo de 4,5. El borde oscuro de la
  decisión 4 lo resuelve sin oscurecer el amarillo.
- El glosario necesita entradas para «Actividad principal», «Trazo de
  referencia» y «Retirar», y ampliar «Traer de afuera» para que incluya
  Caminos. También dice que «A pie con equipo» cambia de nombre solo en una
  ruta de una actividad; con la clasificación por actividad, conviene que
  cambie por actividad (decisión 5).
- La app de hoy muestra la pestaña Anotaciones solo al administrador, y deja
  anotar navegando a cualquier usuario. Las dos cosas tienen que cambiar para
  cumplir la decisión del 5 de octubre (riesgo R32 abierto).
- En la lógica de guardado ya preparada, la validación cuenta caracteres como
  la base, pero dos mensajes de error que traducen lo que contesta la base
  todavía dicen «letras» en vez de «caracteres».
- Al leer un GPX, la herramienta que ya usa la app pone primero lo grabado,
  después lo planeado y al final los puntos. En la vista previa de un GPX el
  orden puede no ser el del archivo.
- No miré la app funcionando: al arrancarla en la computadora para probar, se
  reescribe solo un bloque de las instrucciones para los agentes, y esta tarea
  no permitía tocar otros archivos. Me guié por el código y los documentos.

## Correcciones del 2026-10-06 (revisión de Codex)

1. **Puntos al traer de afuera.** El punto de ejemplo ya no aparece dentro del
   archivo de Ascochinga, que tiene siete líneas y ningún punto. Hay una
   situación aparte, «2b», con un archivo inventado de solo puntos. El resumen,
   el botón «Sumar al mapa» y el resultado cuentan Caminos, trazos y puntos, y
   se puede completar un archivo que trae solo puntos.
2. **Permisos de Anotaciones.** La pestaña ya no es solo del Administrador:
   Premium la ve con sus acciones (sumar, y cambiar o borrar lo suyo), el
   Administrador puede con todo y Normal solo mira. Lo mismo vale en la ficha
   de un punto o un trazo del mapa, y la tabla de permisos lo incluye.
3. **Topes de texto en caracteres.** Contadores y avisos cuentan caracteres
   como la base: un emoji o un símbolo que el navegador cuenta doble vale uno.
   Los mensajes dicen «caracteres» y usan 120, 2.000 y 1.000.
