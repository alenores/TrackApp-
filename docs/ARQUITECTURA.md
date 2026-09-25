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

Dos guardados, separados por una razón de tamaño:

- **El paquete.** Todo lo liviano: las rutas con sus textos y sus números, las
  zonas, los sectores y las anotaciones. Es texto y coordenadas: pesa nada.
- **Las líneas de los recorridos.** Van aparte, en el depósito grande del
  navegador. Una sola ruta puede traer miles de puntos; unas decenas de rutas
  desbordan el guardado simple, y cuando eso pasa **la app no puede guardar nada
  más**, ni siquiera lo liviano.
- **Los pedazos de mapa.** También en el depósito grande, y también por peso.
  A diferencia de lo anterior, **estos los elige el usuario**: bajan cuando pide
  el mapa de un sector, y se van cuando lo saca.
- **Las fotos chicas de las anotaciones.** En el depósito grande. Bajan solas
  después de cada puesta al día, sin que nadie las pida: son livianas. La foto
  grande nunca baja (decisión 023).
- **Las anotaciones pendientes.** Lo que se marcó, cambió o borró sin señal
  desde la navegación, con sus fotos. Sube solo con señal y **con la navegación
  cerrada**; lo hace el armazón de la app, en cualquier otra pantalla. Ver
  `lib/anotaciones/pendientes.ts` y `lib/anotaciones/subir-pendientes.ts`.

La puesta al día es **automática y muda**: sin cartel de «hay novedades», sin
botón de actualizar, sin preguntar nada. Dos límites la protegen:

1. Solo ocurre con señal, y **nunca durante una navegación**. La navegación
   lee con `usePaqueteGuardado`, nunca con `useDatosDeLaApp`, y la puesta al
   día se niega a correr con la navegación abierta.
2. Si falla a mitad de camino, **queda lo que había**. Una actualización
   incompleta nunca puede romper un paquete que ya servía.

**Pasa una vez por apertura, no en cada pantalla**, y otra vez justo después de
guardar algo. Si no hubo señal, la próxima pantalla reintenta. Ver
`decisiones/022` y `lib/offline/puesta-al-dia.ts`.

Para saber si hay novedades se pide **una fila por tabla**: la fecha de
modificación más nueva. Ordenar es trabajo de la base, no del celular. Recién si
esa fecha es más nueva que la del paquete se baja algo.

Toda lista se trae **por tandas y ordenada por una columna única**, y se compara
lo que llegó contra lo que informa la base. La base devuelve como máximo 1000
filas por respuesta y no avisa: responde bien, con la lista cortada.

### Lo que viene guardado con la app

Todo lo que está en `public/` —letras, íconos y motor del mapa, fotos de fondo,
íconos de la app— entra en la **precarga**: se guarda al instalar la app y se
usa siempre desde el celular, sin preguntar a internet. Se renueva solo con una
versión nueva de la app. La precarga contesta antes que cualquier regla de
`runtimeCaching` en `next.config.ts`: para saber qué hace el motor offline con
un archivo, primero hay que fijarse si está en la precarga del `sw.js` que se
publica.

### Lo que el celular no puede recordar solo

El navegador puede borrar todo lo guardado cuando el teléfono se llena, y lo
borra entero. Como los datos vuelven solos al abrir con señal, después de un
borrado la app se ve perfecta y los mapas no están.

Por eso **qué mapas bajó cada usuario se anota también en la base**, en
`mapas_bajados`. Es la única memoria que sobrevive al borrado. Al abrir con señal
se emparejan las dos listas, **en un solo sentido y solo agregando**: lo que está
en el celular y no en la base se anota; lo que está en la base y no en el celular
**no se borra**, porque eso es justamente la pérdida que hay que avisar.

Sacar un mapa a propósito funciona sin señal, así que el aviso a la base puede no
salir. Ese sacado queda anotado como pendiente en el celular y no cuenta como
pérdida hasta que la base lo acepte. Ver la decisión 021.

## El mapa

**Hay un solo mapa en toda la app.** Los tres modos —sin mapa, mapa simple y
mapa satelital— son ese mismo mapa con distinto fondo. No son tres pantallas.

**El fondo sale de lo que el usuario bajó, sector por sector.** Un sector con
mapa bajado se dibuja; uno sin bajar no dibuja nada y se ve el fondo liso de la
app. **Eso no es una falla, es un modo legítimo:** se ven igual la línea de la
ruta, el punto del GPS, las anotaciones y los rectángulos, y con eso alcanza
para ver dónde estás respecto de la línea.

De dónde sale el fondo se decide en **un solo lugar**: ninguna pantalla lo sabe.

**Cómo llega el mapa al celular.** El mapa del mundo vive en un archivo único en
internet, de más de cien gigas, y no se baja entero: se le piden los pedacitos
del rectángulo del sector. Ese archivo no le entrega pedazos a un navegador, así
que el servidor de TrackApp hace de puente mientras dura la descarga. **No se
aloja nada**: no hay archivo de mapa guardado en ningún servidor propio. Un
sector de sierra son 84 pedazos, 1 MB y 6 segundos, medidos. Ver
`decisiones/017`.

**Navegar no consulta internet porque no hay a dónde salir.** El mapa lee los
pedazos por una dirección que no sale del teléfono. Las letras y los íconos del
mapa son archivos de la app, no pedidos a un servidor: si no, un mapa sin señal
quedaría sin un solo nombre escrito.

**Borrar el mapa de un sector no borra sus pedazos a ciegas.** Los sectores
vecinos los comparten, así que se dice qué pedazos siguen haciendo falta y se va
todo lo demás.

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

Lo que hace: prende el GPS solo al entrar y lo apaga al salir, y muestra tu
posición sobre la línea de la ruta. No hay carteles de desvío (decisión 025).
Avisa si el GPS deja de dar novedades, porque un punto viejo que no se mueve parece un
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
