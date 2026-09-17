# Glosario de TrackApp

> Términos propios del proyecto. Si un término se usa en el código o en una
> conversación y no está acá, se agrega.

## Mapas y offline

**Imagen de mapa (tile)**
El mapa se arma como un mosaico de imágenes cuadradas. Cada nivel de acercamiento
tiene su propio juego. Cada nivel adicional multiplica por cuatro la cantidad.

**Mapa básico**
La línea del recorrido dibujada sobre fondo vacío, sin cartografía. Es lo que se
ve sin conexión cuando no se descargaron las imágenes del mapa.

**Mapa completo**
Lo mismo, con las imágenes de la cartografía descargadas.

**Nivel de acercamiento (zoom)**
Cuán de cerca se mira. En esta app va de 10 (una sierra entera) a 15 (un sendero).

**Desvío**
Distancia entre la posición del usuario y la línea del recorrido. Por encima de
50 metros se considera fuera de ruta y se alerta.

## Diseño

**Modo sol**
Fondo claro con texto oscuro. Es el modo legible con sol directo.

**Modo noche**
Fondo oscuro con texto claro. Para poca luz.

**Zona tocable**
El área que responde al toque de un botón. Puede ser más grande que el dibujo del
botón. Nunca baja de 56 píxeles.

## Dominio

**Ruta**
Un recorrido cargado desde un archivo GPX o KML. Tiene una línea, una distancia y
un tipo de actividad.

**Zona**
Un área geográfica que agrupa sectores.

**Sector**
Un área concreta dentro de una zona, definida por cuatro esquinas, con un nivel de
acercamiento recomendado para descargar su mapa.
