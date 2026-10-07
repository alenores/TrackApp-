# Glosario de TrackApp

> Términos propios del proyecto. Si un término se usa en el código o en una
> conversación y no está acá, se agrega.

> **Revisión conceptual en curso (2026-10-07):** «Ruta» y «Parte de ruta»
> describen la app anterior y un prototipo local. **Caminos** ya se integró
> dentro de Mapas. **Circuitos** nombra la planificación futura y todavía no
> tiene módulo.
> Ver
> `docs/planes/2026-10-05-mapas-caminos-circuitos.md`. No usar las entradas
> actuales como contrato de la estructura futura.

## Mapas y offline

**Mapas**
El módulo para explorar Córdoba. Tiene pestañas de zonas, mapa general,
Caminos, Anotaciones y descargas. Administrador y Premium pueden sumar y editar
el contenido propio del mapa; el Administrador también puede editar el ajeno.

**Mapa general**
La vista de Córdoba dentro de Mapas. Dibuja el perímetro y el nombre de cada
zona, más todos los Caminos, puntos y trazos. Los sectores se ven al abrir una
zona.
Al hacer clic o tocar una zona muestra su ficha breve y el acceso «Ver zona».
Al tocar una anotación muestra su nombre, comentario y foto disponible; en PC,
el cursor cambia al pasar sobre un punto.

**Descargas**
La pestaña de Mapas que muestra los mapas bajados en este celular, el espacio
que ocupan y el botón para sacar cada uno. Anda sin señal.

**Imagen de mapa (tile)**
El mapa se arma como un mosaico de imágenes cuadradas. Cada nivel de acercamiento
tiene su propio juego. Cada nivel adicional multiplica por cuatro la cantidad.

**Sin mapa**
Modo de navegación con la línea de la ruta y el punto de GPS sobre fondo vacío,
sin cartografía. Es un modo válido, no una falla.

**Mapa simple**
El mapa sin vista satelital. **Siempre incluye curvas de nivel**, sin excepción.

**Mapa satelital**
El mapa con la foto del terreno real de fondo. También puede mostrar curvas de
nivel, que se prenden y apagan.

**Foto satelital**
La imagen del terreno que va de fondo en el mapa satelital. Sale de Sentinel-2
sin nubes (EOX, datos de Copernicus): diez metros por píxel, se ven bosques,
agua y roca, no senderos. Baja por el mismo tipo de puente que el mapa y se
guarda en el mismo depósito, con su propio nombre.

**Señal débil**
El teléfono dice que hay red pero no pasa nada por ahí: la rayita del cerro. Para
la app es exactamente lo mismo que no tener señal. Se detecta preguntándole al
servidor si responde a tiempo (decisión 026).

**Puesta al día**
Cuando la app le pregunta a la base si hay novedades y, si hay, las baja al
celular. Automática y muda. Pasa una vez por apertura y después de guardar
algo, nunca al pasar de pantalla ni durante una navegación.

**Precarga**
Lo que la app guarda sola al instalarse: todo lo que está en `public/`, como
las letras, los íconos y el motor del mapa. Se usa siempre desde el celular y
se renueva solo con una versión nueva de la app. No es el **paquete**: el
paquete son los datos y se pone al día al abrir.

**Curvas de nivel**
Las líneas que marcan el desnivel. No son parte de la imagen del mapa: son un
dato aparte que se descarga una vez por sector y se dibuja sobre cualquiera de
los dos mapas. Siempre visibles en el simple, opcionales sobre el satelital.
No bajan hechas: el celular las calcula a partir del **relieve**.

**Relieve**
La altura del terreno, punto por punto, guardada como imagen. Baja con el mapa
de cada sector, en un solo acercamiento, y de ahí salen las curvas de nivel.
Sale de un archivo del mundo distinto del mapa (Mapterhorn, con datos de
Copernicus). Se pide por el mismo tipo de puente y se guarda en el mismo depósito.

**Mapa básico** — *palabra retirada (2026-09-23)*
No se usa más: se confundía con el mapa simple. La ruta sobre fondo vacío se
llama **sin mapa** (ver arriba). En la app se dice **simple** o **satelital**.

**Mapa completo**
Lo mismo, con las imágenes de la cartografía descargadas.

**Nivel de acercamiento (zoom)**
Cuán de cerca se mira. En esta app va de 10 (una sierra entera) a 15 (un sendero).

**Anotación**
Algo que se agrega encima del mapa para enriquecerlo. Puede ser un punto o un
trazo, con comentario y foto. La hace el administrador desde la computadora o
cualquier usuario desde la navegación. **Ninguna es privada**: todos ven todas,
y cada uno elige cuáles mostrar. Ver `decisiones/023`.

**Anotar**
Marcar una anotación desde los mapas del cerro: el círculo de anotaciones y
«Agregar una anotación». Queda en el celular y sube sola cuando hay señal.

**Anotación pendiente**
Lo que se marcó, cambió o borró sin señal y espera en el celular para subirse.
Sube sola con señal y la navegación cerrada. Mientras espera se ve en tu mapa
con un aviso, y el inicio dice cuántas quedan y por qué falló la última vez.

**Casillas de anotaciones**
Las tres opciones de qué anotaciones ver en los mapas del cerro: las tuyas, las
del administrador y las de otros usuarios. Se combinan como quieras y se
recuerdan en el celular.

**Mapa perdido**
Un mapa que la base dice que el usuario había bajado y que ya no está en el
celular. **No es lo mismo que uno que nunca bajó:** el perdido lo tenía y no lo
sabe, y por eso se avisa distinto y más fuerte.

**Sacar un mapa**
Que el usuario quite del celular, a propósito, un mapa que había bajado. Se dice
«sacar» y no «borrar» para distinguirlo del borrado que hace el navegador por su
cuenta, que es lo que produce un mapa perdido.

**Sacado pendiente**
Un mapa que el usuario sacó sin señal y que la base todavía no sabe que sacó.
Mientras esté pendiente no se cuenta como perdido: si se contara, la app le
ofrecería recuperar justo lo que él decidió tirar.

**Punto**
Anotación de un lugar, con su ícono según el tipo (refugio, arroyo, cumbre,
puente, pueblo, cartel, fuente, iglesia, cruce, mirador, cascada, tranquera).
Puede llevar comentario y foto. Se ubica tocando el mapa o pegando la coordenada
de Google Earth. No necesita pertenecer a un sector: el administrador también lo
carga desde **Mapas → Anotaciones**, y lo mismo vale para un trazo. Se abre
tocándolo en el mapa o en la lista, y ahí se edita o se borra. Se descarga con
las demás anotaciones, aunque no se haya bajado el mapa de un sector.
Ver decisión 027.

**Trazo**
Anotación de una línea dibujada a mano uniendo varios puntos, con color
elegible. Sirve para marcar lo que el mapa no muestra: un río, una huella, un
alambrado. Se dibuja de a toques, un punto por toque. No confundir con el
**sendero**, que es el camino a pie que ya trae el fondo del mapa.

**Traer de afuera**
Sumar anotaciones a un sector desde otro lado, en vez de dibujarlas: desde un
archivo de Google Earth, o las tranqueras y alambrados de OpenStreetMap. Con
vista previa antes de guardar. Ver decisión 010.

**Tranquera**
Ícono de punto para el portón de un alambrado: marca por dónde se pasa. Las
trae OpenStreetMap, que las tiene; el mapa de fondo no.

**Cobertura**
La relación entre una ruta y los sectores que la cruzan. Un tramo puede estar
cubierto y descargado, cubierto sin descargar, o sin cobertura.

**Sin cobertura**
Un tramo de ruta por el que no pasa ningún sector. No hay mapa disponible para
esa parte del recorrido.

## Diseño

**Modo sol**
Fondo claro con texto oscuro. Es el modo legible con sol directo.

**Modo noche**
Fondo oscuro con texto claro. Para poca luz.

**Franja**
La barra de color al costado izquierdo de una tarjeta, que la marca como aviso.
Hay tres: verde (está listo), ámbar (falta algo y todavía estás a tiempo) y rojo
(hay un problema). Una tarjeta sin franja no es un aviso.

**Rayita y borde fuerte**
Dos bordes distintos, a propósito. La **rayita** separa dos superficies y puede
ser tenue, porque no se lee. El **borde fuerte** es el contorno de algo que se
toca —un campo, un botón, el foco— y sí tiene que verse con sol de frente.

**Desplegable**
Una lista que se abre al tocar y muestra una opción por renglón, de 56 píxeles.
Reemplaza a la lista del sistema, que está prohibida. Se usa cuando las opciones
son muchas o crecen con el tiempo, como las zonas. Para pocas opciones que
conviene ver juntas se usan botones.

**Foto de fondo**
La foto que va detrás de una lista, como la de rutas o la de mapas. Con sol va
casi entera; de noche solo se asoma. Es decoración: no se toca ni se lee.

## Usuarios

**Administrador**
Ale. Único dueño del producto. Hay uno solo.

**Premium**
Los amigos de Ale.

**Normal**
El resto de los usuarios: amigos de amigos y cualquiera que llegue.

## Dominio

**Camino** — *concepto aprobado e implementado en Mapas*
Una línea de Mapas que representa una posibilidad de paso, incluso sobre agua
en kayak. Puede dividirse en partes con condición de paso y complejidad local.
Indica una o más actividades para las que sirve; al menos una es obligatoria.
La condición de paso y la complejidad local de cada parte se registran para
cada actividad y pueden ser distintas entre actividades.
La observación y la fecha de comprobación son únicas para la parte y se
comparten entre actividades.
En el mapa se ven todos los Caminos: los de la actividad elegida tienen
prioridad visual y los de otras actividades siguen visibles y consultables.
Si la línea quedó mal dibujada, un usuario autorizado puede corregir ese
mismo Camino en la app, sin crear otro.
No es una anotación de trazo ni una salida planificada. Ale confirmó el nombre
«Caminos» el 2026-10-05.

**Circuito** — *concepto aprobado, todavía no existe en la app*
La salida que se planifica tomando partes de Caminos ya marcados, dibujando
partes propias o combinando ambas. Al tomar un Camino no hace falta redibujarlo.
Las partes propias pueden seguir vías evidentes del mapa de fondo. Los puntos
y trazos sirven de referencia, sin ser obligatorios. Armar un Circuito no crea
ni modifica contenido de Mapas. Su desarrollo queda para una etapa posterior.
Es distinto de una **Salida**, que cuenta lo que ocurrió realmente.
En la pantalla se dice **Circuito**; no se introduce «plan» como nombre
alternativo. Si sus partes quedan separadas, se avisa **«Partes sin unir»**.
Se dibuja marcando puntos directamente sobre el mapa. Puede empezar en
cualquier lugar. Si dos puntos seguidos caen sobre un mismo Camino, la línea
del Circuito sigue ese Camino entre los dos; luego puede salir libremente.
Cada Circuito tiene una actividad. Mientras se arma, se pueden mostrar Caminos
de una o varias actividades; al pasar el mouse por un Camino aparecen todas
las que tiene asociadas. Las partes propias se ven con línea continua neutra;
las que toman un Camino conservan sus colores y marcas. Ver decisión 046.
Su detalle lleva siempre un resumen escrito debajo del mapa: distingue partes
propias y tomadas de Caminos, y refleja las clasificaciones actuales de estos.
También informa partes sin unir y Caminos retirados, sin avisos superpuestos
por cada cambio. Ver decisión 047.
Si terminaba en la punta de un Camino y esa punta se corrige, conserva su
lugar anterior. Ver decisión 048.

**Ruta**
La línea subida a la app desde un archivo. Tiene nombre, distancia, desnivel,
dificultad técnica y esfuerzo globales, y comentarios. Puede tener varias
partes con condiciones diferentes; la valoración global no colorea esas partes.

**Es la palabra definitiva y la única.** Nunca «track», «trayecto» ni
«recorrido» para referirse a esto. `TrackApp` sigue siendo el nombre del
producto: eso no es el concepto y no se renombra.

**Parte de ruta**
Una sección continua de la línea de una ruta, elegida marcando su inicio y su
final desde la computadora. Tiene su propia condición de paso y complejidad.
Puede volver a clasificarse sin cambiar las partes vecinas.

**Condición de paso**
Lo que se sabe sobre atravesar una parte: **por explorar** (línea entrecortada),
**transitable** en la actividad (línea continua), **a pie con equipo** (línea de
puntos) o **sin paso** (línea visible con X). En una ruta solo de bicicleta o
solo de kayak, la pantalla usa esos nombres concretos.

**Complejidad de una parte**
Fácil (verde), media (amarillo) o difícil (rojo). Es independiente de la condición
de paso y de la dificultad técnica y el esfuerzo de la ruta completa. Si aún no
se evaluó, queda **sin clasificar** y se dibuja en gris, nunca en verde por
defecto.

**Zona**
Agrupación de sectores, con nombre, descripción y un rectángulo propio de dos
puntos. **El rectángulo de la zona no se descarga nunca**: existe solo para
medir qué parte de su territorio todavía no tiene sector encima. Su propósito
de producto es organizar la cobertura y descarga de mapas; no clasifica ni
delimita Caminos, Circuitos o anotaciones (decisión 035).

**Sector**
Rectángulo alineado al norte dentro de una zona, definido por **dos puntos**: la
esquina noroeste y la sudeste. Es la unidad que se descarga; no define a qué
Camino, Circuito o anotación pertenece un lugar (decisión 035).

**Cobertura**
Cuánto de una ruta cae adentro de algún sector, y de esos sectores cuáles están
descargados. Tiene tres estados y ninguno queda mudo: está todo listo, falta
bajar el mapa de un sector, o hay un pedazo de ruta que no cae en ningún sector.

**Hueco**
El pedazo de una zona que todavía no tiene ningún sector encima. Es la misma
idea de cobertura mirada desde el otro lado, y sirve para saber qué sectores
faltan crear antes de que hagan falta.

**Paquete**
Todo lo liviano que la app guarda en el celular para funcionar sin señal: las
rutas con sus textos, las zonas, los sectores y las anotaciones. Se actualiza
solo, sin preguntar nada. **Las líneas de los recorridos no van adentro**: pesan
demasiado y viajan aparte.

**Navegación libre**
El mapa del cerro sin seguir una ruta: todos los mapas bajados, todas las
anotaciones y las rutas que elijas (todas, ninguna o algunas), con tu punto de
GPS. Abre mostrando todas las zonas desde arriba y, cuando el GPS responde, va
a donde estás. Tiene las mismas reglas que la navegación: nunca consulta
internet.

**Mapa de la zona**
El mapa chico que se abre con el ícono de mapa en «Rutas en el mapa»: la zona
con sus sectores y tu punto azul. Tocando un sector, la lista pasa a ser la de
ese sector. Lee solo lo guardado en el celular.

**Filtro de rutas**
Lo que achica la lista de rutas según zona, para qué sirve, largo, dificultad
técnica, esfuerzo y si el mapa está en el celular. Muestra lo mismo que la
tarjeta de la ruta, con los mismos dibujos. Los filtros puestos quedan arriba de
la lista como pastillas y cada una se saca con su cruz.

**Circulitos de técnica**
Cómo se dibuja la dificultad técnica: cinco circulitos, y cada uno vale 2
puntos. Una ruta de dificultad 5 pinta tres. En el filtro, tocar el tercero
quiere decir «hasta dificultad 6».

**Velocímetro de esfuerzo**
Cómo se dibuja el nivel de esfuerzo: una aguja y un color por nivel, verde
(bajo), amarillo (medio), rojo (alto) y rojo fuerte (muy alto).

**Desnivel positivo / desnivel negativo**
Lo que se sube y lo que se baja en una ruta. Se guardan por separado porque
castigan distinto. Los calcula la app desde el archivo: nunca se cargan a mano.
La única excepción es una **salida** sin archivo GPS, que es un relato y no se
usa para navegar: ahí se pueden escribir.

**Pedazo de mapa**
La unidad mínima en que se guarda un mapa: un cuadradito del terreno, que
existe repetido a distintos acercamientos. Un sector de sierra son unos 84.
**Se dice «pedazo», nunca «tesela» ni «tile».**

**Acercamiento**
Cuánto se acerca el mapa. Cada nivel de acercamiento tiene su propia grilla de
pedazos. **Prohibido «zoom» y «nivel de zoom».**

**Puente**
Lo que hace el servidor de TrackApp cuando el celular baja un mapa: le pide los
pedazos al archivo del mundo y se los pasa. Existe porque ese archivo no le
entrega pedazos a un navegador. Ver `decisiones/017`.

**Depósito**
Donde el celular guarda lo pesado: las líneas de los recorridos, los pedazos de
mapa, las fotos chicas de las anotaciones y las anotaciones pendientes. Es distinto del **paquete**, que es lo
liviano y dibuja las pantallas al instante.

**Foto de anotación**
La foto del lugar que marca una anotación: para lo que el mapa no puede mostrar
—si el vado se cruza, cuál de los dos senderos es el bueno—. Tiene dos tamaños:
la **foto grande** y la **foto chica**. Ver `decisiones/023`.

**Foto grande**
La foto de una anotación en tamaño completo, hasta 2 MB. Se ve con internet, en
las pantallas de zonas y sectores. **Nunca baja al celular.**

**Foto chica**
La misma foto, achicada para la pantalla del celular: unos 120 KB como máximo.
Se arma en el teléfono al elegir la foto. **Es la única que se ve en el cerro**,
y baja sola con cada puesta al día, sin que nadie la pida.

**Invitación**
Lo que se le pasa a un amigo para que abra TrackApp: un texto con el link, por
WhatsApp, o un **código QR** que se escanea con la cámara. Vive en la pantalla
de perfiles, en la tarjeta «Invitá a un amigo». El link es la dirección desde
donde se está usando la app.

**Salida**
Lo que alguien hizo un día, contado para los demás: título, día, qué hicieron,
esfuerzo, los números, hasta cuatro fotos y con quién fue. Puede llevar el
archivo GPS. **Es un módulo 100 % con internet**: se carga y se mira con señal,
no se guarda en el celular y no se mezcla con la navegación. No confundir con
«salir de la navegación», que es cerrar el mapa del cerro.

**Actividad**
Lo que se hace: trekking, correr, mountain bike, kayak o canyoning (su ícono es
alguien bajando en rapel). **Es una sola lista para toda la app**: las rutas,
las salidas y lo que practica cada usuario, que se elige al editar el perfil y
se muestra en su tarjeta.

**Registro de salida**
Lo que se junta de una salida mientras se navega: los puntos por donde vas,
anotados solos con la pantalla prendida, y los que marcás con la banderita
**«Marcar acá»**. Se guarda en el celular sin señal y, al terminar, sube solo
como borrador. Ver `decisiones/032`.

**Borrador**
Una salida que solo ve quien la hizo, hasta que la completa y toca «Publicar».
Es lo que queda de un registro de salida al subir.

**Compañero**
Un usuario de TrackApp que fue a una salida con quien la cargó. Se elige al
cargarla, de la lista de usuarios.

**Portada de la salida**
La primera de las fotos de una salida, apaisada (4 de ancho por 3 de alto). Se
recorta a esa forma al elegirla: lo que se ve al recortar es lo que se ve en la
lista. En la tarjeta va a la manera de Strava: el título y el día arriba a la
izquierda, chicos; al centro, los números en fila y debajo una firma chica y
fina de la **línea de la salida**. La foto casi no se oscurece: queda de fondo,
entremezclada con los datos. En la ficha va limpia, solo con el título y el día.
Sin foto, lo mismo va sobre un fondo oscuro.

**Filtro de salidas**
Lo que achica la lista de salidas por título, qué hicieron, esfuerzo, quién fue
(la cargó o fue de compañero) y entre qué fechas. Lo resuelve la base, así vale
para todas las salidas. Los filtros puestos quedan arriba como pastillas, cada
una con su cruz.

**Línea de la salida**
El dibujo del camino que hizo la salida, sobre la portada: chico, fino y en un
celeste suave, de la familia del recuadro del sector. Nada del cerro se le
parece, pero no tapa la foto. Sale del archivo GPS; una salida sin archivo GPS
no tiene línea.

**Ficha de la salida**
La pantalla que se abre tocando una salida: todo lo que tiene, con la
descripción, todas las fotos y el archivo GPS. La tarjeta de la lista muestra
solo lo principal.

**Tres puntitos**
El botón para editar algo propio. En salidas lleva a editarla; borrar está
adentro de la edición, nunca a un toque desde la lista.

**Texto sobre foto**
Lo que se escribe encima de una foto: siempre claro sobre un degradé oscuro, en
modo sol y en modo noche, porque la foto no cambia con el modo.

**Código QR**
El cuadradito que la cámara del celular lee para abrir el link de la app. Se
dibuja siempre en negro sobre blanco, en modo sol y en modo noche, porque un QR
invertido no lo lee cualquier cámara.
