# Registro de sesiones

Formato definido en `MANTENIMIENTO.md`. Más reciente arriba.

---

## Sesión 2026-09-24 — El filtro de rutas, rehecho, y la foto de fondo con sol

### Estado al inicio

Otro agente había agregado un filtro a la lista de rutas que no filtraba:
ofrecía actividades que la carga no tiene (bici, moto, 4x4, caballo), comparaba
el esfuerzo como número contra una palabra, tenía dificultad del 1 al 4 contra
una carga del 1 al 10, contaba las rutas sin largo como de 0 km y no cambiaba
el contador de arriba. Además, con sol la foto de fondo se veía lavada arriba.

### Lo que se hizo

Con mockup aprobado por Ale:

- **Filtro nuevo.** Zona en un desplegable; para qué sirve con las mismas
  insignias de la tarjeta; largo en km escrito a mano, desde y hasta; dificultad
  con los cinco circulitos de la tarjeta (cada uno vale 2 y marca el tope);
  esfuerzo con el velocímetro y su color; y si el mapa está en el celular. El
  botón dice cuántas rutas van a quedar antes de aplicar. Los filtros puestos
  quedan arriba de la lista como pastillas, y el botón Filtrar dice cuántos hay.
- **Las cuentas del filtro viven en la capa de lógica**, con su prueba.
- **Colores de la técnica y del esfuerzo** pasaron a variables, uno por modo.
  Antes estaban escritos a mano en la tarjeta.
- **Foto de fondo**: pieza compartida para rutas y mapas. Con sol va casi entera
  y encuadrada en el cerro, con un degradé detrás de las tarjetas; de noche
  queda como estaba.
- Piezas compartidas nuevas: el desplegable y la foto de fondo. La insignia de
  actividad ahora se puede usar suelta y apagada.
- **Los filtros se recuerdan** en el celular (pedido de Ale): al ir a una ruta
  y volver, o al abrir la app otro día, la lista sigue filtrada. Siempre se ven
  como pastillas arriba. Lo guardado se revisa al leerlo, y una zona que ya no
  existe se ignora.

**Navegar ya no sale a internet ni al reabrir la app.** Revisando a pedido de
Ale se encontró que, si la app se reabría parada en la navegación, se ponía al
día con la base desde ahí: la navegación usaba una pieza que dispara la puesta
al día. Ahora lee solo lo guardado, y la puesta al día se niega a correr con la
navegación abierta; la hace la primera pantalla que se abra después. Con su
prueba automática, que falla sin el arreglo.

### Documentos actualizados

`GLOSARIO.md` (desplegable, foto de fondo, filtro de rutas, circulitos de
técnica, velocímetro de esfuerzo).

### Deuda o inconsistencias detectadas

- La tarjeta de la ruta todavía escribe a mano el celeste del largo
  (`text-cyan-300`) y usa `text-verde`, que no existe en los colores de la app,
  para el «MAPA OFFLINE 100%».

---

## Sesión 2026-09-23 — El satelital baja al celular, y la app deja de consultar en cada pantalla

### Estado al inicio

El mapa simple se bajaba y andaba. El satelital existía solo en vivo, al marcar
rectángulos, y un comentario del código decía que su licencia no dejaba
guardarlo. Ale notó que pasar de pantalla en pantalla era lento aunque los
datos ya estuvieran en el celular.

### Lo que se hizo

**Satelital, la parte que no se ve.** Se verificó la licencia: Sentinel-2 sin
nubes de EOX es Creative Commons no comercial, y su servicio es libre para usos
no comerciales citando la fuente. Se puede guardar. El comentario estaba mal.
Se midió la foto sobre el Champaquí: 11 a 22 KB por pedazo, disponible hasta el
acercamiento 17. Se armó:

- el puente `api/satelital`, igual a los del mapa y el relieve;
- la foto en el mismo depósito, con su propio nombre (`satelital/z/x/y`);
- un sector satelital = el dibujo + el relieve + la foto;
- el candado `foto-guardada://`, que lee la foto del celular y nunca sale a
  internet;
- pasar de satelital a simple libera la foto, sin tocar la de un sector vecino;
- el peso aproximado ya cuenta la foto.

**Lentitud.** Se encontró la causa en el código: cada pantalla, al abrirse,
consultaba la base, repasaba todas las pantallas guardadas y los mapas bajados.
Ahora se hace una vez por apertura y después de guardar algo → `decisiones/022`.

### Documentos actualizados

`ARQUITECTURA.md`, `GLOSARIO.md` (foto satelital, puesta al día), decisiones
`013`, `017` y la nueva `022`.

### Deuda o inconsistencias detectadas

- **Borrar una ruta desde su tarjeta, o renombrar un sector, no se veía hasta
  cambiar de pantalla**: refrescaban la pantalla sin volver a traer los datos.
  Quedó cubierto con la puesta al día después de guardar.
- **El glosario llama «mapa básico» a la ruta sobre fondo vacío**, pero el
  botón del mapa en vivo dice «Básico» para el mapa simple. Dos cosas con la
  misma palabra.
- La prueba de los archivos del motor offline solo pasa después de compilar,
  porque revisa archivos que genera la compilación.

### Segunda parte (2026-09-24), por pedido de Ale, sin mockup

- «Básico» retirado: el botón dice **Simple** y **Satelital**.
- **Un sector puede tener los dos mapas** (decisión 012 cambiada). Se baja cada
  uno por separado desde el sector, desde la ruta y desde el inicio; se saca
  cada uno desde «Mapas descargados».
- Navegando, el botón Simple/Satelital muestra solo lo que está bajado en los
  sectores de la ruta; sin nada, no aparece. La foto se lee del celular.
- Las pantallas de entrada ya no esperan al servidor: todas abren desde lo
  guardado (decisión 022).

### Tercera parte (2026-09-24)

- Ale aplicó el script de la base: un sector guarda una fila por tipo de mapa.
- Botón «Curvas: sí / no» sobre la foto satelital; sin curvas, sin velo.
- Crear una ruta trae solo los sectores que toca, por tandas, y avisa si la
  lista vino cortada (antes, sin tope y con el error tragado).
- Botón de sincronizar a mano: **no, por ahora** (decidió Ale).

### Pendientes para la próxima

1. Probar en producción con modo avión: el satelital navegando y las pantallas
   de entrada sin señal (lo hace Ale).
2. Valores finos del velo sobre la foto, con la prueba al sol.

---

## Sesión 2026-09-21 — El mapa de montaña: lo que ya traía, lo que faltaba dibujar y las curvas

### Estado al inicio

El mapa se veía vacío en la sierra: ni senderos, ni arroyos, ni cumbres, ni
refugios. Se pensó que Protomaps no traía esos datos y se planteó armar teselas
propias desde OpenStreetMap. Las curvas de nivel estaban decididas (013) pero
no construidas: la red de la sesión anterior no dejaba llegar a ninguna fuente
de relieve. Las anotaciones solo se podían marcar como punto.

### Lo que se hizo

**Primero se midió, no se supuso.** Se contó qué tiene OpenStreetMap en el
recuadro del Champaquí (254 senderos, 557 cursos de agua, 18 cumbres, 17
refugios, 20 tranqueras) y después se abrió la tesela real de Protomaps sobre
la misma zona: **casi todo eso ya estaba en el archivo que la app baja.** Lo
escondía el dibujo, pensado para ciudad: un sendero en gris casi blanco de
medio píxel, un arroyo recién al acercarse mucho, y refugios, campings,
miradores, cuevas y manantiales sin dibujar porque la lista de puntos no los
incluía y la hoja de íconos no los tenía. Armar teselas propias habría sumado
solo las tranqueras y alambrados, que Protomaps descarta. Se descartó.

**El fondo, corregido para la sierra.** Senderos a rayas y en color de tierra,
aparte de los caminos de auto; arroyos visibles y desde más lejos; nombres de
senderos. Cinco íconos propios —refugio, carpa, mirador, cueva, manantial—
dibujados con la paleta de Protomaps y sumados a su hoja en cada compilación,
sin tocar la original. Los puntos de montaña entran en la lista, con letra un
poco más grande.

**Los trazos.** La pantalla de anotaciones ya permite dibujar una línea de a
toques, deshacer el último, elegir color de cuatro con nombre, y editar o
borrar. La base y el mapa ya los aceptaban.

**Las curvas de nivel.** Lo que baja con el sector es el relieve —la altura
del terreno como imagen, de Mapterhorn/Copernicus— y las curvas las calcula
el celular, leyendo siempre de lo guardado. Un sector de sierra de 6 × 6 km
suma menos de medio mega. Verificado en la app real, sin señal, en los dos
modos.

**Una prueba que no corría en Windows** se arregló: buscaba fin de línea de
Unix en un archivo que Git escribe con el de Windows.

**Y la actualización rompía la pantalla abierta.** Al probar en el celular, Ale
vio «Esta pantalla se rompió» al abrir la navegación: la app se había
actualizado sola con cinco versiones nuevas y la pantalla vieja pedía archivos
que ya no existían. La red de rescate ahora reconoce ese caso, avisa que hay
versión nueva y recarga sola, una vez. Y se copió la prevención de Vías de
Escalada: recargar al llegar la versión nueva, solo en actualización y solo en
segundo plano; acá, además, nunca navegando (R25). Un segundo cartel, «bloque
de memoria inservible», era de las curvas recién hechas: un bloque vacío
compartido, la misma trampa que el lector del mapa ya evitaba (R26).

**Y el gesto de «tirar para recargar» se fue.** Ale lo vio en el celular y lo
quiso afuera, como en Vías de Escalada. La regla de estilos que lo desactiva
ya estaba y no alcanzaba; ahora la app ignora el gesto ella misma, fuera del
mapa y solo cuando no queda nada por desplazar hacia arriba. De paso: la pieza
que traba el zoom todavía buscaba el mapa del motor anterior, así que no
reconocía al actual; corregido.

**La causa de fondo del cartel, recién a la tercera.** Con la versión nueva ya
abajo, el cartel seguía: la pantalla de navegación guardada para el cerro era
de la versión vieja, no se reemplaza nunca, y con una raya de señal se servía
antes que la red. Ahora una versión nueva tira todas las pantallas guardadas
de la anterior y el calentador las rehace (R27). Y lo que Ale veía como «se
refresca» al deslizar era la barra de «yendo a otra pantalla», que se prendía
al apoyar el dedo sobre una tarjeta; ahora se prende al tocar el link (R28).

**Traer de afuera.** Ale pidió las dos cosas que habían quedado pendientes, y
resultaron ser una sola: sumar anotaciones a un sector desde otro lado. Desde
un archivo de Google Earth (marcadores → puntos con el ícono adivinado por el
nombre; líneas → trazos con el color más parecido), y desde OpenStreetMap
(tranqueras → puntos con ícono nuevo; alambrados → trazos «Límite»), por un
puente propio a Overpass con sesión. Siempre con vista previa: qué entra, qué
cae fuera del sector, qué ya estaba. Probado en la app: Los Gigantes tiene una
tranquera en OpenStreetMap y ningún alambrado.

### Decisiones tomadas

- No se arman teselas propias desde OpenStreetMap: el dato ya está en Protomaps.
  Lo único que Protomaps no trae —tranqueras y alambrados— entra como
  anotaciones, pedidas a OpenStreetMap por sector.
- Los colores de trazo son cuatro, con nombre, y se guardan como color fijo:
  son un dato del usuario, no una pieza de la interfaz.
- Las curvas se calculan en el celular desde el relieve; no se bajan hechas.
- El sombreado del terreno se probó y se sacó: no estaba decidido y complicaba
  el borde del sector.

### Documentos actualizados

`decisiones/013` (cómo se construyó, medido), `decisiones/017` (curvas ya no
pendientes), `GLOSARIO.md` (relieve; trazo vs. sendero), `RIESGOS.md` (R25 a R28),
`AGENTS.md` (regla de la versión nueva; sin tirar para recargar),
`DISENO_EXTERIOR.md` (sin tirar para recargar), `decisiones/010` (traer de
afuera, hecho), `SCHEMA.md` (ícono tranquera), este registro.

### Deuda o inconsistencias detectadas

- **La altura de las cumbres** no viene en la tesela de Protomaps: el mapa dice
  «Cerro Champaquí» pero no «2790 m». El número lo dan las curvas.
- **La foto satelital** sigue sin existir; las curvas sobre la foto (velo, botón
  de prender y apagar) quedan para cuando exista.
- Se creó un sector de prueba, «Los Gigantes - Refugio Nores», en la zona
  Copina - Los Gigantes, para poder navegar la única ruta que hay. Ale decide
  si queda o se borra.

### Pendientes para la próxima

- Que Ale mire las curvas en el celular, al sol, y ajuste grosor y color si
  hace falta (perillas en `lib/mapas/relieve.ts` y las variables de color).
- Volver a tocar «Tranqueras y alambrados» en Los Gigantes: la tranquera se
  borró por error en las pruebas y OpenStreetMap frenó los pedidos seguidos.

---

## Sesión 2026-09-21 — Si el navegador borra los mapas, ahora te enterás

### Estado al inicio

Las dos apps ya le piden al navegador que no borre lo guardado. Pero ese pedido
no es una garantía: lo concede el navegador solo. Faltaba responder qué pasa
cuando igual lo borra.

### Lo que se hizo

**Primero se revisó qué hace hoy cada app.** En Vías de Escalada el resultado es
bueno: como su paquete es todo, un borrado deja el celular sin nada y la app
muestra la pantalla de primera descarga, con barra de progreso y, sin señal, un
cartel que lo explica. El usuario se entera sí o sí.

En TrackApp el resultado era malo, y de la peor manera: los datos vuelven solos
al abrir con señal, así que la pantalla se veía impecable y los mapas no estaban.
Ni el inicio ni la lista decían una palabra. Se enteraba en el cerro.

**La causa.** El paquete de TrackApp es lo que el usuario eligió bajar, y esa
elección vivía únicamente en el celular: el borrado se la llevaba también, así
que la app no tenía con qué darse cuenta de que faltaba algo.

**La solución.** Una tabla nueva en la base guarda qué mapas bajó cada uno. Al
abrir con señal la app compara esa lista contra lo que hay en el celular y avisa
en el inicio: los mapas perdidos con franja ámbar y un botón que los recupera
todos, y aparte, más tranquilo, las rutas que nunca tuvieron mapa bajado.

**Lo que casi lo vuelve una mentira.** Sacar un mapa a propósito funciona sin
señal; avisarle a la base, no. Sin resolverlo, quien sacaba un mapa en el cerro
se encontraba al bajar con que la app le ofrecía recuperar justo lo que había
tirado. El sacado queda anotado como pendiente en el celular y no cuenta como
pérdida hasta que la base lo acepte.

**Se miró con los ojos, no solo con pruebas.** El aviso se abrió en el navegador
en modo sol y en modo noche, en singular y en plural, y con la conexión cortada.
Ahí aparecieron dos errores de redacción que ninguna prueba automática iba a
encontrar: decía «Bajalo» con tres mapas y «Si pensás hacerlas» con una sola
ruta.

### Decisiones tomadas

- `021` — La base recuerda qué mapas bajaste. El emparejado va del celular a la
  base y **solo agrega**: nunca se borra de la base un mapa porque no esté en el
  celular, porque eso es justamente la pérdida que hay que detectar.

### Riesgos

- **R23 cerrado del todo.** Que el navegador conceda o no el espacio permanente
  ya no se avisa: no es una falla, es una probabilidad, y el usuario no puede
  hacer nada con ese dato.
- **R24 nuevo y resuelto:** un borrado del navegador dejaba TrackApp viéndose
  perfecta y sin mapas.

### Lo que queda

- **OpenStreetMap:** revisar qué datos hay de verdad alrededor del Champaquí
  (senderos, arroyos, cumbres, refugios) para decidir si vale la pena armar
  nuestras propias imágenes de mapa. Quedó frenado por permisos de red.
- El **mapa trucho** de fotos de Google Earth georreferenciadas.
- Las **curvas de nivel** desde el modelo de elevación de 5 metros de IDECOR.
- El **satelital para bajar**: hoy solo baja el mapa simple.
- Probar en **modo avión** con el celular.

---

## Sesión 2026-09-20 — La foto de la anotación, en el cerro

### Estado al inicio

Ya se podían marcar anotaciones con foto desde la computadora: elegir el punto
sobre la foto satelital, ponerle ícono, comentario y foto. Pero la foto se
mostraba desde internet, así que **en el cerro no se veía**, que es justo el
único lugar donde sirve.

### Lo que se hizo

**La foto baja con el mapa del sector.** Cuando el usuario baja el mapa de un
sector bajan también las fotos de las anotaciones de ese sector, y quedan en el
celular. En la navegación se tocan los puntos del mapa y se abre la ficha con la
foto y el comentario. La foto se lee del celular: nunca de internet.

**Una foto que falla no traba el mapa.** Sector en verde quiere decir que se
puede navegar con fondo, y eso no se toca. Si una foto no entra, el sector queda
bajado igual y se dice cuántas faltan y por qué.

**Una foto agregada después también se sabe en casa.** Cada mapa bajado se
acuerda de qué fotos trajo. Si a un sector ya bajado le agregan una foto, la
ruta y el sector lo dicen con un botón para bajarla. En el cerro no hay
sorpresas.

**Se encontró y se arregló un bug que afectaba a toda la app.** Cerrar cualquier
cartel con la X le pedía al navegador volver atrás, y eso rearma la pantalla
entera: el mapa se destruía y **el toque siguiente se perdía**. Se encontró
abriendo la app en un navegador de verdad y tocando dos anotaciones seguidas.
Ver R18.

**Se borró una pantalla de prueba que había quedado publicada.**

**Dos fallas más, encontradas por Ale en producción.** En el celular el fondo
del mapa no se dibujaba —faltaba la receta de los íconos para pantalla de alta
densidad, que ahora se arma sola en cada compilación— y desde Windows no se
podía subir un archivo de ruta, porque la app le creía al navegador cuando decía
que un `.gpx` era «un archivo cualquiera». Ver R19 y R20. Las dos tienen la
misma forma: **no se ven desde donde se desarrolla.**

**La pantalla negra del cerro.** Ale avisó que, sin señal, abrir el detalle de
una zona dejaba la app en negro con el ícono en el medio, sin poder hacer nada.
Reproducido en el navegador, eran dos fallas encadenadas y la más grave no era
la que se veía: **la app no guardaba nada**, porque uno de los tres archivos del
motor offline se iba a la pantalla de entrar y el motor se caía al arrancar, en
silencio. Con señal se veía perfecta. Ver R21 y R22.

**La ruta, dibujada sobre su zona y sus sectores.** Con el mapa de internet
atrás, los tres niveles se leen de un vistazo: la zona punteada, el sector
bajado en verde, el que falta en ámbar. Los números pasaron a ser información al
costado y no un veredicto: un kilómetro sin mapa adentro de un pueblo no es lo
mismo que uno en el filo, y eso se ve, no se lee. Aparece también al **subir**
una ruta, que es cuando mirás un archivo que te pasaron. Y **todo mapa de la app
se abre en grande** con un botón, porque en el celular un recuadro chico no
alcanza.

**Sin señal, lo que no funciona no se muestra.** Probando en modo avión apareció
que los botones de crear, editar y bajar seguían ahí, y que «Perfiles» seguía en
el menú aunque esa pantalla no se guarda nunca. Ahora desaparecen, y la app se
entera al instante de que la señal se fue: no hace falta recargar.

**Y las pantallas se dejan listas solas.** Apenas el paquete queda al día, la
app recorre y guarda todas las que van a hacer falta sin señal —cada zona, y de
cada ruta su ficha y su navegación— en vez de esperar a que el usuario las
visite una por una. Es lo mismo que hace Vías de Escalada, que se miró para
copiar el método, incluido el detalle medido allá de no marcar el pedido interno
como precarga: con esa marca el servidor contesta un resumen que no alcanza para
dibujar la pantalla.

**Y se le pide al navegador que no borre lo guardado.** Un navegador que se
queda sin espacio borra todo lo de un sitio de una vez, sin avisar: los datos,
los mapas, las fotos y las pantallas. Ninguna de las dos apps lo pedía. Ahora sí,
las dos.

### Decisiones tomadas

- `019` — La foto de la anotación viaja con el mapa del sector, no con el
  paquete: lo que pesa lo elige el usuario.
- `020` — La ruta se mira sobre su zona y sus sectores; los números son
  informativos. Todo mapa se abre en grande.

### Riesgos

- **R18 nuevo y resuelto:** cerrar un cartel rompía el mapa y se perdía el toque
  siguiente. Segundo caso, después de R17, de un problema que ninguna prueba
  automática veía y que se encontró **abriendo la app y mirando**.
- **R19 y R20 nuevos y resueltos:** el fondo del mapa no se dibujaba en el
  celular, y desde Windows no se podía subir un archivo de ruta.
- **R21 y R22 nuevos y resueltos:** la app no guardaba nada para usar sin señal,
  y la tapa del arranque no se destapaba nunca cuando una pantalla fallaba.

### Lo que queda

- El **mapa trucho**: el rompecabezas de fotos de Google Earth georreferenciadas
  para ver el terreno con detalle de verdad. Decidido que se hace.
- Probar en **modo avión** con el celular.
- Las **curvas de nivel** desde el modelo de elevación de 5 metros de IDECOR.
- El **satelital para bajar**: hoy solo baja el mapa simple.
- Que el aviso de fondo del mapa no tape el selector de dibujo/foto cuando el
  mapa queda muy bajo.

---

## Sesión 2026-09-19 — Los mapas se bajan de verdad

### Estado al inicio

El mapa era un fondo vacío: la app dibujaba la línea de la ruta y el punto del
GPS sobre nada. Estaba decidido de dónde saldría el mapa (decisión 007) pero no
existía ni el mecanismo ni la pantalla.

### Lo que se hizo

**Bajar el mapa de un sector, de punta a punta.** Se recortan del archivo
mundial solo los pedazos del rectángulo del sector y quedan en el celular.
Medido contra el archivo de verdad: un sector de sierra son 84 pedazos, 1 MB y
6 segundos. Una zona entera, 3292 pedazos — por eso existen los sectores.

**Dos cosas cambiaron la arquitectura y se supieron probando, no leyendo:** el
archivo del mundo no le entrega pedazos a un navegador, así que el servidor de
TrackApp hace de puente; y su nombre cambia todos los días, así que la dirección
se busca en vez de escribirse. Ver decisión 017.

**El motor offline no abría ni una pantalla en modo avión.** La configuración
decía, para toda pantalla, «traela siempre de internet». Se reescribió entera
tomando como molde la de Vías de Escalada. Es el hallazgo más grave de la
sesión y no tenía nada que ver con los mapas.

**Once alertas críticas de seguridad**, dos de ellas de ejecución de código sin
estar logueado, cerradas al actualizar el framework.

### Decisiones tomadas

- `017` — Cómo llega el mapa al celular: el servidor hace de puente, no se aloja
  nada, la dirección se busca, y las letras del mapa viajan adentro de la app.

### Riesgos

- **R1, R2 y R11 resueltos.** Borrar libera el espacio de verdad y no se lleva
  el mapa del vecino; acercarse de más agranda en vez de quedar en blanco; las
  pantallas se enteran solas de lo que se bajó.
- **R14 nuevo, y bajado de crítico a deuda:** la librería que hace andar la app
  sin señal está abandonada desde 2022. Vías de Escalada usa la misma versión
  sobre el mismo framework y funciona, así que no es un incendio.
- **R15 nuevo y resuelto:** la app no abría ni una pantalla sin señal.

### Lo que queda

- Probar en **modo avión**. Es la única prueba que vale y no se puede
  automatizar.
- Las **curvas de nivel** desde el modelo de elevación de 5 metros de IDECOR,
  que se verificó que cubre toda la sierra (decisión 013).
- El **satelital**: lo mejor libre para la sierra son 10 metros por píxel. Se
  ven bosques y lagos, no senderos. Se construye después del simple.

---

## Sesión 2026-09-18 — Cimientos: reglas base del proyecto

### Estado al inicio

Andamiaje de documentación creado el día anterior. Faltaban las reglas de
fondo que gobiernan todo el proyecto.

### Lo que se hizo

Se cerraron cinco reglas base que no dependen de decisiones funcionales:

- **Red de seguridad:** ninguna función crítica se entrega sin prueba
  automática. Es el único mecanismo que le avisa a Ale que algo se rompió sin
  que tenga que leer código.
- **La ubicación es dato sensible:** por defecto se usa y se descarta.
  Guardarla requiere decisión explícita y escrita.
- **Cómo habla la app:** voseo, directo, errores que dicen qué pasó y qué hacer.
- **Un concepto, una palabra:** todo en español, pantalla y código. Glosario
  como fuente.
- **Entender antes de tocar:** método obligatorio ante un error, con
  explicación a Ale en criollo antes de arreglar.

Se fijaron las tres categorías de usuario, **sin permisos**.

### Decisiones tomadas

- `004` — Tres niveles de usuario (permisos deliberadamente sin definir)
- `005` — Pruebas automáticas como red de seguridad
- `006` — Sin tratamiento de dato sensible. Ale lo descartó: la app funciona
  sobre confianza total. Se quitó la regla de ubicación de las reglas base.

### Reglas agregadas en la segunda pasada

Al revisar contra Vías de Escalada aparecieron cinco cosas que se habían
salteado y que sí son cimiento:

- **Navegar sin señal:** sin señal la navegación interna deja la pantalla en
  blanco si no se usa la pieza compartida de navegación. Lección aprendida a los
  golpes en el otro proyecto.
- **Red de rescate cuando una pantalla revienta**, que no se borra nunca.
- **Separación de capas:** lógica, datos y pantalla en lugares distintos. Un
  componente de pantalla no consulta la base por su cuenta.
- **Tope de 1000 filas de la base:** devuelve la lista cortada sin avisar. En el
  otro proyecto dejó 202 rutas invisibles durante meses.
- **Checklist obligatoria de once puntos para toda pantalla nueva**, que es el
  mecanismo que hace cumplir el resto de las reglas.
- **Botones con variantes definidas y un solo rojo para borrar.**

### Corrección de rumbo

Se intentó definir los permisos de cada categoría de usuario. **Fue un error:**
los permisos son consecuencia de funciones que todavía no existen. Se registró
la categorización sin permisos y se dejó el resto para cuando la app esté
definida funcionalmente.

De ahí sale una regla general: **no se toman decisiones funcionales antes de la
definición funcional**, ni se le piden a Ale disfrazadas de decisiones técnicas.

### Deuda e inconsistencias detectadas

- Sigue sin definirse «qué NO es la app». Se decidió que se deriva de lo que sí
  es, y por eso queda para después de la definición funcional.
- Falta elegir herramienta de pruebas.

### Pendientes para la próxima

**Ale describe funcionalmente cómo tiene que trabajar la aplicación.** Ese es el
siguiente paso acordado.

---

## Sesión 2026-09-17 — Análisis de mapas y arranque de la documentación

### Estado al inicio

App funcionando, sin documentación. Como reglas para agentes solo existían seis
líneas sobre Git y un archivo que ordenaba subir cambios sin pedir permiso. Cero
reglas de producto, diseño, UX u offline.

### Lo que se hizo

- Análisis completo de cómo funcionan los mapas y el sistema offline.
- Se confirmó que **nunca existió** mapa satelital ni de relieve, verificando
  todo el historial del proyecto.
- Se identificaron cuatro problemas y una limitación, registrados en `RIESGOS.md`.
- Se midió la app: 131 archivos, unas 9.100 líneas, 16 pantallas.
- Se revisó Vías de Escalada Córdoba como referencia de documentación y de
  modelo offline.
- Se borraron las reglas viejas y se escribió `AGENTS.md` desde cero.
- Se creó toda la estructura de documentación.

### Decisiones tomadas

- **Se refactoriza esta app, no se empieza un proyecto nuevo.** El stack ya es el
  correcto y lo que molesta es una porción acotada.
- **El código existente no es referencia de nada.** Fue un ejercicio de
  aprendizaje.
- Diseño para exterior → `decisiones/001`
- PWA ahora, empaquetado Android opcional al final → `decisiones/002`
- Modelo offline → `decisiones/003`, **abierta**

### Documentos creados

`AGENTS.md`, `CLAUDE.md`, y en `docs/`: `MANTENIMIENTO.md`,
`DISENO_EXTERIOR.md`, `ARQUITECTURA.md`, `RIESGOS.md`, `GLOSARIO.md`,
`SCHEMA.md`, `SESIONES.md`, más tres decisiones.

### Deuda e inconsistencias detectadas

- Sin acceso a la base de TrackApp. `SCHEMA.md` quedó sin verificar.
- Los valores de contraste y tamaño no fueron probados al sol.
- Las cuatro pantallas de módulos que no se analizaron siguen sin documentar.

### Pendientes para la próxima

1. Que Ale revise `AGENTS.md`, en especial la sección de Git.
2. Probar los valores de diseño al sol, con el celular en la mano.
3. Cerrar la decisión 003 sobre el modelo offline.
4. Conseguir acceso a la base para completar `SCHEMA.md`.

---

## Sesión 2026-09-19 — La app se reescribe entera sobre la base nueva

### Estado al inicio

La base de datos ya estaba rehecha desde cero y la mitad del código nuevo
escrito, pero la app **no compilaba**: quedaban doce pantallas —los formularios
de carga y edición, y las fichas de ruta y de zona— todavía apuntando al código
viejo que se había borrado.

Además había un solo juego de colores y ningún botón para cambiarlo, aunque las
reglas del proyecto piden dos modos desde el primer día.

### Lo que se hizo

**Mockup aprobado.** Se armaron cuatro pantallas de muestra en el lenguaje
visual actual —mismas tarjetas, mismo verde, mismo fondo— y Ale las aprobó sin
cambios. El campo donde se pega una coordenada se hizo funcionando de verdad
sobre el mockup, para poder probar la trampa del link de Google Maps.

**Los dos modos de color, de verdad.** Lo que lo impedía no era el botón: eran
34 pantallas que escribían los colores a mano. Ahora ninguna lo hace. Las dos
listas de variables tienen exactamente los mismos nombres, y **una prueba
automática verifica en cada cambio** que estén completas y que cada combinación
de texto y fondo llegue al mínimo de contraste, en los dos modos. Esa prueba
encontró tres colores que no llegaban, el verde del botón principal entre ellos.

**Las doce pantallas que faltaban.** Ninguna consulta la base: todas dibujan
desde lo guardado en el celular, así que la ficha de una ruta se abre en el
cerro. Para eso el paquete offline ahora guarda también el «qué llevar» y las
«complicaciones», que antes solo vivían en la base.

**El bloque de cobertura**, que aparece en la ficha de la ruta y también al
subirla, con sus tres estados. Como los archivos de mapa todavía no existen, lo
dice con esas palabras en vez de mostrar un botón que no funciona.

**Lint limpio por primera vez.** Había siete errores de antes. Se arreglaron de
fondo, no tapándolos.

### Decisiones tomadas

- **Navegar sin mapa: se avisa, no se bloquea** → `decisiones/014` (decidió Ale)
- **Los dos modos de color y la prueba que los sostiene** → `decisiones/015`
- El mockup de las pantallas nuevas queda aprobado tal cual.
- Dos mejoras de detalle que Ale había habilitado: el gris de las etiquetas
  quedó un punto más claro y el verde del botón principal un punto más oscuro.
  Los dos estaban por debajo del contraste que pide el propio proyecto.

### Documentos actualizados

`ARQUITECTURA.md` (reescrito entero: el anterior describía el código viejo y ya
era falso), `RIESGOS.md`, `GLOSARIO.md`, `DISENO_EXTERIOR.md`, más las
decisiones `014` y `015`.

### Deuda o inconsistencias detectadas

- **`GLOSARIO.md` se contradecía a sí mismo**: decía que la palabra definitiva
  es «ruta» y en el renglón siguiente prohibía usar «ruta». Era el resto de un
  renombre automático. Corregido.
- **`ARQUITECTURA.md` describía el código viejo entero.** Reescrito contra el
  código real.
- Riesgos nuevos anotados: nadie lleva todavía la cuenta de qué mapa está
  bajado (R11), sin señal no se sabe quién subió una ruta (R12), y el modo sol
  nunca se probó con sol de verdad (R13).
- Los riesgos R1 y R2 quedaron neutralizados, no resueltos: el código que los
  causaba se borró, pero vuelven solos el día que existan los archivos de mapa.
  Quedan anotados como requisitos de ese trabajo.

### Pendientes para la próxima

1. **Los archivos de mapa.** Es lo único grande que falta y lo que desbloquea
   descargar, borrar lo descargado y ver fondo en el cerro.
2. Probar el modo sol al sol, con el celular en la mano.
3. Las anotaciones sobre el mapa: la base y la lógica están, falta la pantalla
   para dibujarlas.
4. Empaquetado para Android, al final y si conviene.
