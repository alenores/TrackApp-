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

**Google Maps**
El servicio externo de Google. En Marcas, su ícono junto al título abre
la zona que se está mirando en otra pestaña, usando el centro actual del
mapa. Las coordenadas no se muestran. Ver decisión 072.

**Mapa de Google**
Imagen satelital que se mira con conexión en las fichas y mapas de consulta.
Muestra Caminos, Circuitos, zonas, sectores y marcas que TrackApp ya tiene.
No se usa para editar ni para navegar; no se descarga. Hasta activarlo se ve
el satelital propio; si Google activado falla, la consulta lo explica.


**Mapas**
El módulo para explorar Córdoba, **solo con conexión**: sin señal desaparece
del menú. Tiene cuatro entradas en el menú, sin pestañas adentro: Consultas,
Marcas, Zonas y Descargas. Ver decisión 052.

**Consultas**
La entrada de Mapas para todo público: el mapa con todas las marcas y las
zonas, para mirar. Arriba del panel hay un buscador de zonas, Caminos y
Detalles: no distingue mayúsculas ni tildes; si el mismo texto está en las
tres, la zona queda primera, después el Camino y al final el detalle. Al
elegir uno, el mapa viaja hasta ahí, de a poco. Lo mismo al elegir una
marca en Marcas. Los resultados van justo debajo del cuadro de buscar,
juntos en un recuadro. Destildar Zonas oculta sus líneas; con Zonas prendida,
adentro se elige si se ven solo las zonas o también los sectores. Filtros
simples: la actividad y prender o apagar Caminos, Zonas y Detalles. En
Caminos no se muestra la ayuda de colores y líneas. Al tocar una zona muestra
su ficha breve; al tocar un punto, su nombre, comentario y foto. Reemplazó al
«mapa general».

**Detalles**
En Consultas, el grupo que junta puntos y trazos: todo
lo marcado que no es un Camino.

**Lista y mapa**
Los dos momentos de mirar marcas: elegir qué ver y mirarlo. En la computadora
van lado a lado; en el celular el mapa ocupa la pantalla y la lista es un
panel que sube desde abajo y, bajado, queda como una **barrita** con el
resumen.

**Descargas**
La entrada de Mapas que muestra los mapas bajados en este celular, el espacio
que ocupan y el botón para sacar cada uno. Como todo Mapas, con conexión.

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
nivel, que se prenden y apagan. En la navegación, sobre la foto se dibujan los
ríos, arroyos, senderos y huellas del mapa simple: la foto no deja ver por
dónde pasan, y esas líneas sí. El color de la tierra no se pinta, para que la
foto se siga viendo.

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

**Alturas de un Camino**
La altura del terreno cada 25 m a lo largo de la línea, más una en el final.
Las averigua la app con el **relieve** al guardar el Camino, porque las líneas
de Google Earth no traen altura. Son una estimación y nunca se cargan a mano.
De ahí salen el desnivel y el **gráfico de alturas**. Ver decisión 049.

**Gráfico de alturas**
El dibujo de cuánto sube y baja una línea a lo largo de su largo, como en las
apps de montaña: abajo la distancia, al costado la altura. Va en la ficha de
cada Camino y de cada Circuito, pintado con los colores y marcas de las partes.
Al pasar el dedo o el mouse dice la altura de ese punto y lo marca en el mapa.
En la navegación de un Circuito va dentro de **Información**, con la marca **Estás acá**.

**Qué llevar**
Lo que conviene llevar a un Circuito: agua, repuestos, abrigo. Texto libre.
Reemplaza a «Equipo» de Rutas, porque **equipo** ya nombra a la bici o el
kayak en «a pie con el equipo».

**Mapa básico** — *palabra retirada (2026-09-23)*
No se usa más: se confundía con el mapa simple. La ruta sobre fondo vacío se
llama **sin mapa** (ver arriba). En la app se dice **simple** o **satelital**.

**Mapa completo**
Lo mismo, con las imágenes de la cartografía descargadas.

**Nivel de acercamiento (zoom)**
Cuán de cerca se mira. En esta app va de 10 (una sierra entera) a 15 (un sendero).

**Marca**
Todo lo que se dibuja encima del mapa: Caminos, puntos y trazos.
**Ninguna es privada**: todos ven todas, y cada uno elige cuáles
mirar. Reemplaza a «anotación», que se retiró el 2026-10-13 y solo queda en el
código y en la tabla vieja de la base. Ver decisión 052.

**Marcas (entrada de Mapas)**
La lista de las marcas que entran en el pedazo de mapa que se está mirando,
con tildes, grupos y filtros, y el mapa con lo tildado. Al acercarse o
moverse, lo que quedó afuera deja de listarse. Todos la consultan;
Administrador y Premium además agregan y editan con el «+» y los tres puntos.
Ver decisión 057.

**Marcar en el cerro**
Agregar un punto o un trazo desde los mapas del cerro: el círculo «Marcas» y
«Agregar una marca». Queda en el celular y sube sola cuando hay señal.

**Marca pendiente**
Lo que se marcó, cambió o borró sin señal y espera en el celular para subirse.
Sube sola con señal y la navegación cerrada. Mientras espera se ve en tu mapa
con un aviso, y el inicio dice cuántas quedan y por qué falló la última vez.

**Casillas de marcas**
Las tres opciones de qué marcas ver en los mapas del cerro: las tuyas, las
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
Marca de un lugar, con su ícono según el tipo (refugio, arroyo, cumbre,
puente, pueblo, cartel, fuente, iglesia, cruce, mirador, cascada, tranquera,
estacionamiento, sitio).
Puede llevar comentario y foto. Se ubica tocando el mapa propio o pegando la
coordenada de Google Earth. No pertenece a ningún sector: se carga desde
**Mapas → Marcas**, y lo mismo vale para un trazo. Se descarga con las demás
marcas, aunque no se haya bajado ningún mapa. Ver decisiones 027 y 052.

**Trazo**
Marca de una línea dibujada a mano uniendo varios puntos, con color
elegible. Sirve para marcar lo que el mapa no muestra: un río, una huella, un
alambrado. Se dibuja de a toques, un punto por toque. No confundir con el
**sendero**, que es el camino a pie que ya trae el fondo del mapa.

**Traer de afuera**
Sumar marcas desde un archivo de Google Earth o de un GPS (KML, KMZ o GPX), en
vez de dibujarlas. Cada línea se decide como Camino, trazo u omitir; cada
punto se suma o no. Con vista previa antes de guardar. Ver decisión 052.

**Tranquera**
El portón de un alambrado: marca por dónde se pasa. Es un **punto** con ícono
de tranquera. Si la trajo OpenStreetMap sola al crear una zona, queda fija: no
se corrige ni se borra.

**Alambrado**
Un **trazo** que hace de cerco. Si lo trajo OpenStreetMap al crear una zona,
viene entero aunque cruce el borde y queda fijo, como la tranquera.

**Origen** (de un punto o un trazo)
De dónde salió: dibujado por la gente (propio) o traído de OpenStreetMap. Es un
filtro discreto dentro de Puntos y Trazos en Marcas.

**Cobertura**
La relación entre una ruta y los sectores que la cruzan. Un tramo puede estar
cubierto y descargado, cubierto sin descargar, o sin cobertura.

**Sin cobertura**
Un tramo de ruta por el que no pasa ningún sector. No hay mapa disponible para
esa parte del recorrido.

## Diseño

**Pestaña**
Nombre en una fila que cambia la sección que se ve abajo, sin hacer ninguna
acción. La elegida lleva una raya verde abajo; las otras quedan apagadas. No
es un botón. Se usa, por ejemplo, en el editor de un Camino (Datos, Línea,
Partes) y para pasar de una parte a otra.

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
No es un trazo ni una salida planificada. Ale confirmó el nombre
«Caminos» el 2026-10-05.

**Circuito** — *implementado en su propio módulo*
La salida que se planifica tomando partes de Caminos ya marcados, dibujando
partes propias o combinando ambas. Al tomar un Camino no hace falta redibujarlo.
Las partes propias pueden seguir vías evidentes del mapa de fondo. Los puntos
y trazos sirven de referencia, sin ser obligatorios. Armar un Circuito no crea
ni modifica contenido de Mapas.
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
Lleva técnica, esfuerzo, qué llevar, complicaciones y comentario cargados a
mano; su largo, su desnivel y su **gráfico de alturas** se calculan solos con
la línea vigente. La lista de Circuitos se abre desde el menú; Salidas es el
inicio de la app (decisión 051). Al navegarlo
se puede registrar la Salida, marcar, prender otros Circuitos y abrir
**Información**: el nombre, la forma vista desde arriba, dónde estás y el
gráfico de alturas con «Estás acá». Ver decisiones 049 y 067.

**Información**
La ventana que se abre al navegar un Circuito. El título dice Información;
adentro van el nombre, la miniatura de la línea vista desde arriba (con los
colores y las marcas de cada tramo), el largo, dónde estás y el gráfico de
alturas. La ayuda de colores y líneas no está a la vista: se abre con el
círculo de ayuda y se cierra al tocarlo de nuevo. Ver decisión 067.

**Circuitos en el mapa**
La lista para prender otros Circuitos sobre el mapa al navegar uno. Arriba se
elige el sector por su nombre; si hay más de una zona, primero la zona. El
Circuito que se está haciendo va aparte, sin tilde. Debajo van los otros de
ese sector. En el detalle de una zona, el botón del mapa que muestra los
Circuitos que la cruzan. Ver decisión 068.

**Ruta** — *retirada el 2026-10-08 (decisión 049)*
El módulo viejo: una línea subida desde un archivo con sus datos globales. Lo
reemplazan **Camino** y **Circuito**: sus datos pasaron al Circuito y su
navegación, a la navegación del Circuito. No se usa más en pantalla.

**Es la palabra definitiva y la única.** Nunca «track», «trayecto» ni
«recorrido» para referirse a esto. `TrackApp` sigue siendo el nombre del
producto: eso no es el concepto y no se renombra.

**Parte de ruta** — *descartada (decisiones 033 y 049)*
El prototipo que partía una ruta en partes. Esas reglas viven ahora en las
partes de cada **Camino**.

**Condición de paso**
Lo que se sabe sobre atravesar una parte: **por explorar** (línea entrecortada),
**transitable** en la actividad (línea continua), **a pie con equipo** (línea
continua con triangulitos chicos) o **sin paso** (línea visible con X). En una ruta solo de bicicleta o
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
delimita Caminos, Circuitos ni marcas (decisión 035).

**Sector**
Rectángulo alineado al norte dentro de una zona, definido por **dos puntos**: la
esquina noroeste y la sudeste. Es la unidad que se descarga; no define a qué
Camino, Circuito o marca pertenece un lugar (decisión 035).

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
rutas con sus textos, las zonas, los sectores y las marcas. Se actualiza
solo, sin preguntar nada. **Las líneas de los recorridos no van adentro**: pesan
demasiado y viajan aparte.

**Navegación libre**
El mapa del cerro sin seguir una ruta: todos los mapas bajados, todas las
marcas y las rutas que elijas (todas, ninguna o algunas), con tu punto de
GPS. Abre mostrando todas las zonas desde arriba y, cuando el GPS responde, va
a donde estás. Tiene las mismas reglas que la navegación: nunca consulta
internet.

**Mapa de la zona** — *retirado de la navegación el 2026-10-18 (decisión 068)*
Era el mapa chico para cambiar de sector dentro de «Circuitos en el mapa».
Ahí el sector se elige por su nombre.

**Filtro de rutas** — *retirado con Rutas (decisión 049)*
Achicaba la lista de rutas. Lo reemplaza el filtro de Circuitos.

**Filtro de Circuitos**
Lo que achica la lista de Circuitos. El nombre se busca arriba de la lista,
mientras se escribe («Buscar Circuito»); a su derecha, el ícono de filtrar
abre el resto: actividad, creado por, largo (desde y hasta, en km) y
esfuerzo. Se resuelve en el celular, también sin señal. Un Circuito sin largo
medido queda afuera si se filtra por largo.

**Creado por**
Quién creó un Circuito: su foto y su nombre, en la tarjeta de la lista y en
el detalle. Viaja con lo guardado en el celular.

**Circulitos de técnica**
Cómo se dibuja la dificultad técnica: cinco circulitos, y cada uno vale 2
puntos. Una ruta de dificultad 5 pinta tres. En el filtro, tocar el tercero
quiere decir «hasta dificultad 6».

**Velocímetro de esfuerzo**
Cómo se dibuja el nivel de esfuerzo: una aguja y un color por nivel, verde
(bajo), amarillo (medio), rojo (alto) y rojo fuerte (muy alto).

**Desnivel positivo / desnivel negativo**
Lo que se sube y lo que se baja en un Camino o un Circuito. Se guardan por
separado porque castigan distinto. Los calcula la app con las **alturas**:
nunca se cargan a mano. En un Camino se miden desde donde empieza su dibujo; al
revés se invierten. En un Circuito, en el sentido en que se dibujó.
La única excepción es una **salida** sin archivo GPS, que es un relato y no se
usa para navegar: ahí se pueden escribir.
En las cifras de un Circuito (tarjeta de la lista y detalle) se titulan
**«Sube»** y **«Baja»**, cada una con su flecha en diagonal, porque cuatro
columnas en el celular dejan poco ancho.

**Cifras del Circuito**
Cómo se presenta un Circuito, igual en la tarjeta de la lista y en el detalle:
la actividad, el largo grande al medio —el dato más importante— y abajo cuatro
columnas del mismo peso: técnica, esfuerzo, sube y baja. Lo que falta va con
una raya.

**Ayuda**
El ícono de signo de pregunta en un círculo. Muestra lo que explica una
pantalla, como qué significa cada color y línea, en vez de tenerlo siempre a
la vista.

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
mapa, las fotos chicas de las marcas y las marcas pendientes. Es distinto del **paquete**, que es lo
liviano y dibuja las pantallas al instante.

**Foto de una marca**
La foto del lugar que marca un punto o un trazo: para lo que el mapa no puede mostrar
—si el vado se cruza, cuál de los dos senderos es el bueno—. Tiene dos tamaños:
la **foto grande** y la **foto chica**. Ver `decisiones/023`.

**Foto grande**
La foto de una marca en tamaño completo, hasta 2 MB. Se ve con internet, en
Mapas. **Nunca baja al celular.**

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
anotados solos con la pantalla prendida, y los que marcás con el señalador
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
Lo que achica la lista de salidas. El título se busca arriba de la lista,
mientras se escribe («Buscar salida»); a su derecha, el ícono de filtrar abre
el resto: actividad, esfuerzo, participantes (la cargó o fue de compañero) y
entre qué fechas. Lo resuelve el celular sobre todas las salidas, que se
traen una sola vez por apertura: buscar o filtrar no le pregunta a la base. Los
filtros puestos, salvo el título, quedan arriba como pastillas, cada una con
su cruz.

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
