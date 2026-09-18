# Glosario de TrackApp

> Términos propios del proyecto. Si un término se usa en el código o en una
> conversación y no está acá, se agrega.

## Mapas y offline

**Imagen de mapa (tile)**
El mapa se arma como un mosaico de imágenes cuadradas. Cada nivel de acercamiento
tiene su propio juego. Cada nivel adicional multiplica por cuatro la cantidad.

**Sin mapa**
Modo de navegación con la línea del track y el punto de GPS sobre fondo vacío,
sin cartografía. Es un modo válido, no una falla.

**Mapa simple**
El mapa sin vista satelital. **Siempre incluye curvas de nivel**, sin excepción.

**Mapa satelital**
El mapa con la foto del terreno real de fondo.

**Mapa básico**
La línea del recorrido dibujada sobre fondo vacío, sin cartografía. Es lo que se
ve sin conexión cuando no se descargaron las imágenes del mapa.

**Mapa completo**
Lo mismo, con las imágenes de la cartografía descargadas.

**Nivel de acercamiento (zoom)**
Cuán de cerca se mira. En esta app va de 10 (una sierra entera) a 15 (un sendero).

**Anotación**
Algo que el administrador agrega encima del mapa para enriquecerlo. Puede ser
un punto o un trazo. Siempre admite un comentario escrito.

**Punto**
Anotación de un lugar, con su ícono según el tipo (refugio, arroyo, cumbre,
puente, pueblo, cartel, fuente, iglesia, cruce, mirador, cascada).

**Trazo**
Anotación de una línea dibujada a mano uniendo varios puntos, con color
elegible. Sirve para marcar lo que el mapa no muestra: un río, una huella, un
alambrado.

**Cobertura**
La relación entre un track y los sectores que lo cruzan. Un tramo puede estar
cubierto y descargado, cubierto sin descargar, o sin cobertura.

**Sin cobertura**
Un tramo de track por el que no pasa ningún sector. No hay mapa disponible para
esa parte del recorrido.

**Desvío**
Distancia entre la posición del usuario y la línea del recorrido. Por encima de
50 metros se considera que el usuario se desvió y se alerta.

**Ojo con el texto en pantalla:** la app hoy dice «¡Fuera de ruta!», que usa una
palabra prohibida por el glosario. Hay que reemplazarlo. Propuesta: «Te
desviaste». **Pendiente de confirmar con Ale.**

## Diseño

**Modo sol**
Fondo claro con texto oscuro. Es el modo legible con sol directo.

**Modo noche**
Fondo oscuro con texto claro. Para poca luz.

**Zona tocable**
El área que responde al toque de un botón. Puede ser más grande que el dibujo del
botón. Nunca baja de 56 píxeles.

## Usuarios

**Administrador**
Ale. Único dueño del producto. Hay uno solo.

**Premium**
Los amigos de Ale.

**Normal**
El resto de los usuarios: amigos de amigos y cualquiera que llegue.

## Dominio

**Track**
El recorrido subido a la app desde un archivo. Tiene una línea, un nombre, una
distancia, desnivel, dificultad y comentarios.

**Es la palabra definitiva y la única.** Nunca «ruta», «trayecto» ni
«recorrido». Es la única palabra en inglés permitida en el proyecto, por
decisión explícita de Ale.

**Zona**
Un área geográfica que agrupa sectores.

**Sector**
Un área concreta dentro de una zona, definida por cuatro esquinas, con un nivel de
acercamiento recomendado para descargar su mapa.
