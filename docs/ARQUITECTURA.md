# Arquitectura de TrackApp

> Última revisión: 2026-09-19 (app reescrita entera sobre la base nueva)

## Stack

Next.js · TypeScript · Tailwind · Supabase · Vercel · App web instalable (PWA).
Es el stack fijo de Ale, sin desvíos.

## La regla que ordena todo: de dónde sale lo que se ve

**Ninguna pantalla consulta la base.** Todas dibujan desde lo que está guardado
en el celular. Internet sirve para poner al día lo guardado, nunca para dibujar
una pantalla.

De ahí salen tres capas y no se mezclan:

| Qué | Dónde vive | Qué nunca hace |
|---|---|---|
| Reglas y cálculos | la capa de lógica | no sabe nada de pantallas |
| Datos guardados y puesta al día | la capa de datos | no decide qué mostrar |
| Pantallas y componentes | presentación | **no pide datos por su cuenta** |

## Lo que la app guarda en el celular

Dos depósitos, por una razón de tamaño:

- **El paquete.** Todo lo liviano: las rutas con sus textos y sus números, las
  zonas, los sectores y las anotaciones. Es texto y coordenadas: pesa nada.
- **Las líneas de los recorridos.** Van aparte, en el depósito grande del
  navegador. Una sola ruta puede traer miles de puntos; unas decenas de rutas
  desbordan el guardado simple, y cuando eso pasa **la app no puede guardar nada
  más**, ni siquiera lo liviano.

La puesta al día es **automática y muda**: sin cartel de «hay novedades», sin
botón de actualizar, sin preguntar nada. Dos límites la protegen:

1. Solo ocurre con señal, y **nunca durante una navegación**.
2. Si falla a mitad de camino, **queda lo que había**. Una actualización
   incompleta nunca puede romper un paquete que ya servía.

Para saber si hay novedades se pide **una fila por tabla**: la fecha de
modificación más nueva. Ordenar es trabajo de la base, no del celular. Recién si
esa fecha es más nueva que la del paquete se baja algo.

Toda lista se trae **por tandas y ordenada por una columna única**, y se compara
lo que llegó contra lo que informa la base. La base devuelve como máximo 1000
filas por respuesta y no avisa: responde bien, con la lista cortada.

## El mapa

**Hay un solo mapa en toda la app.** Los tres modos —sin mapa, mapa simple y
mapa satelital— son ese mismo mapa con distinto fondo. No son tres pantallas.

**Hoy el fondo es «sin mapa», y eso es correcto, no una falla:** los archivos de
mapa todavía no existen. Se ven la línea de la ruta, el punto del GPS, las
anotaciones y los rectángulos de los sectores sobre fondo vacío. Con eso alcanza
para saber si vas por el camino, porque el cálculo del desvío no mira el mapa.

De dónde sale el fondo se decide en **un solo lugar**. El día que existan los
archivos, ninguna pantalla se entera.

**Los mapas de OpenStreetMap no vuelven.** Su política de uso prohíbe
expresamente descargarlos por adelantado para usarlos sin señal, que es justo lo
que hace esta app, y avisan que bloquean sin aviso. Ver `decisiones/007`.

Los colores del mapa tampoco se escriben a mano: el mapa lo dibuja una librería
que no entiende las clases de la app, así que se pintan con clases de CSS que
leen las mismas variables. Así el mapa cambia junto con el modo sol o noche. La
única excepción es una anotación con color elegido a mano: ese color es un dato
del usuario y manda.

## La navegación

**No consulta internet. Nunca. Por ningún motivo.** Todo lo que necesita se
descargó antes de salir. El GPS no es internet: funciona por satélite y sin
señal.

Lo que hace: sigue la posición, calcula la distancia a la línea del recorrido y
avisa —en pantalla y vibrando— al pasar los 50 metros de desvío. Avisa también
si el GPS deja de dar novedades, porque un punto viejo que no se mueve parece un
punto bueno. Mantiene la pantalla encendida mientras se navega, y solo mientras
se navega: la pantalla prendida consume mucha batería y en el cerro la batería
es seguridad.

**Si falta mapa, no se bloquea: se avisa.** Ver `decisiones/014`.

## La cobertura

Es la pregunta «¿tengo el mapa de esta ruta?», y se responde caminando la línea
del recorrido de a 50 metros y viendo en qué sectores cae cada paso. Se camina
por distancia y no punto por punto porque la cantidad de puntos de un archivo es
arbitraria: un reloj puede grabar uno por segundo y Google Earth uno por
kilómetro.

Devuelve tres cosas: qué sectores cruza, cuáles están bajados, y cuántos metros
no caen en ningún sector. Esos tres estados son los que muestra la app, en la
ficha de la ruta y al subirla.

La misma idea mirada desde el otro lado responde «¿cuánto de esta zona todavía
no tiene sector encima?», y sirve para crear los sectores que faltan antes de
que hagan falta.

## Los colores

Dos modos —sol y noche— definidos con variables, con exactamente los mismos
nombres en los dos. **Ninguna pantalla escribe un color.** Una prueba automática
verifica en cada cambio que los dos modos estén completos y que cada combinación
de texto y fondo llegue al mínimo de contraste. Ver `decisiones/015`.

## Las piezas compartidas

Hay una sola de cada cosa, y no se arma una nueva escribiendo clases a mano: la
tarjeta, el botón con sus cuatro variantes, el campo de texto, el área de varios
renglones, el grupo de opciones que reemplaza al desplegable del sistema, el
campo donde se pega una coordenada, el botón de volver, el botón de modo y la
emergente.

**Una sola pieza dibuja todas las emergentes**, y el apilado no lleva números:
se cuelgan al final del documento y se dibujan en el orden en que se abrieron,
así la última siempre queda arriba. Un número escrito a mano es justo lo que
termina tapando un aviso que nadie ve.

## Lo que se prueba

Lo crítico, no todo. Una batería enorme que nadie mira vale lo mismo que
ninguna. Hoy se prueban:

- los dos modos de color: que estén completos y que cumplan el contraste;
- leer una coordenada de lo que sea que el usuario pegue;
- armar el rectángulo con las dos esquinas;
- la cobertura de una ruta;
- los números que salen del archivo: largo, desnivel y cantidad de puntos;
- el paquete offline y cuándo queda viejo;
- cuándo avisar que falta mapa.

Todas tienen en común que **si fallan no se rompe nada visible**: devuelven un
número equivocado, o se callan algo. Eso es exactamente lo que nadie descubre
leyendo el código ni abriendo la app en casa.

## Pendiente de documentar

- Autenticación y manejo de sesión.
- Los archivos de mapa: de dónde salen, cómo se empaquetan y cómo se bajan.

## Auditoría de fuentes

**Leído en tiempo real (2026-09-19):**
`lib/offline/paquete.ts`, `lib/offline/sincronizacion.ts`,
`lib/offline/recorridos.ts`, `lib/offline/mapas.ts`, `lib/cobertura.ts`,
`lib/coordenadas.ts`, `lib/territorio/esquinas.ts`, `lib/territorio/tamano.ts`,
`lib/rutas/recorrido.ts`, `lib/rutas/archivo.ts`, `lib/navegacion/aviso-de-mapa.ts`,
`lib/modo.ts`, `lib/supabase/listas.ts`, `app/globals.css`,
`components/mapa/mapa.tsx`, `components/mapa/capas-base.ts`,
`components/navigation/navegacion-view.tsx`, `components/ui/*`,
`app/actions/rutas.ts`, `app/actions/territorio.ts`,
y las pantallas de rutas, zonas y sectores.

**Inferido (no verificado):** nada.

**Pendiente de verificación:** nada.
