# Glosario de TrackApp

> Términos propios del proyecto. Si un término se usa en el código o en una
> conversación y no está acá, se agrega.

## Mapas y offline

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
Marcar una anotación desde los mapas del cerro, con el botón «Anotar». Queda en
el celular y sube sola cuando hay señal.

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
puente, pueblo, cartel, fuente, iglesia, cruce, mirador, cascada).

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

**Desvío**
Distancia entre la posición del usuario y la línea del recorrido. Por encima de
50 metros se considera que el usuario está fuera de ruta y se alerta.

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

**Ruta**
El recorrido subido a la app desde un archivo. Tiene una línea, un nombre, una
distancia, desnivel, dificultad y comentarios.

**Es la palabra definitiva y la única.** Nunca «track», «trayecto» ni
«recorrido» para referirse a esto. `TrackApp` sigue siendo el nombre del
producto: eso no es el concepto y no se renombra.

**Zona**
Agrupación de sectores, con nombre, descripción y un rectángulo propio de dos
puntos. **El rectángulo de la zona no se descarga nunca**: existe solo para
medir qué parte de su territorio todavía no tiene sector encima.

**Sector**
Rectángulo alineado al norte dentro de una zona, definido por **dos puntos**: la
esquina noroeste y la sudeste. Es la unidad que se descarga.

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

**Mapa libre**
El mapa del cerro sin seguir una ruta: todos los mapas bajados, todas las
anotaciones y las rutas que elijas (todas, ninguna o algunas), con tu punto de
GPS. Las rutas de la zona donde estás se proponen primero. No avisa desvíos
porque no seguís ninguna. Tiene las mismas reglas que la navegación: nunca
consulta internet.

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
