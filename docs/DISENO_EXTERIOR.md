# Diseño para exterior — el porqué

> Decidido: 2026-09-17 · Decisión formal: `decisiones/001-diseno-exterior.md`

Este documento explica **por qué** cada regla de diseño de `AGENTS.md` es como es.
Las reglas en sí van allá, cortas y en tono de orden. Acá va el razonamiento, para
que nadie las deshaga dentro de seis meses por no entenderlas.

---

## La situación de uso real

TrackApp no se usa sentado en un escritorio. Se usa:

- **Caminando**, con la mochila puesta y una sola mano libre.
- **Con sol de frente**, que es la peor condición de lectura que existe en un
  celular.
- **Sin señal**, en el medio del cerro.
- **Con la batería contada**: quedarse sin batería en la montaña no es una
  molestia, es un problema de seguridad.
- **A veces con lluvia o sudor**, con la pantalla mojada.

Cada regla sale de esas condiciones. Si una regla no se puede justificar contra
una de ellas, sobra.

### Menú y acciones (decisión 051)

Salidas abre al entrar con conexión. El menú mantiene el mismo orden en celular
y computadora: Salidas, Circuitos, Navegación libre, Mapas y Perfiles. Volver,
agregar y navegar usan cada uno un ícono compartido; editar y eliminar aparecen
al abrir los tres puntos. Las tarjetas que llevan a un detalle se abren tocando
cualquier parte y muestran «Abrir» discretamente abajo a la derecha. Sin señal,
la entrada informa que Salidas requiere conexión y ofrece Circuitos y
Navegación libre.

### Nombres de los mapas

En Marcas hay un acceso a Google Maps junto al título, fuera del mapa,
tanto en computadora como en celular. Abre la zona que se está mirando
en otra pestaña; las coordenadas se usan por dentro y no se muestran
(Ale, 2026-10-22, decisión 072).

Al agregar un punto desde Marcas, primero se toca su ubicación sobre Google;
el formulario abre sobre el mapa propio con esa coordenada y la misma vista.
Punto, Trazo y Camino nuevo conservan el centro y el zoom al abrirse desde
Marcas. En PC, agregar, traer y editar marcas mantienen los datos a la izquierda
y el mapa a la derecha; el orden del celular se conserva (decisión 074).

«Navegación libre» nombra la navegación sin seguir una ruta. «Descargas» nombra
la pantalla que muestra los mapas guardados en el celular. «Mapas» tiene cuatro
entradas en el menú, sin pestañas adentro: Consultas, Marcas, Zonas y
Descargas (decisión 052). Consultas y Marcas usan **lista y mapa**: lado a lado
en la computadora; en el celular el mapa llena la pantalla y la lista es un
panel que sube desde abajo, con los gestos de Vías de Escalada, una barrita con
el resumen al bajarlo y el botón «Ver mapa». Consultas abre encuadrando Córdoba y muestra las marcas. Arriba del panel hay
un buscador: al elegir un resultado el mapa viaja hasta esa zona, Camino o
detalle, acercándose de a poco (decisión 055). Lo mismo al elegir una marca
en Marcas. Los resultados van justo debajo del cuadro, juntos en un recuadro
(decisión 058). Destildar Zonas oculta sus líneas; con Zonas prendida,
adentro se elige si se ven solo las zonas o también los sectores (decisión
058). En punto nuevo, Camino nuevo y
trazo nuevo hay tres opciones de líneas, que empiezan sin líneas y van arriba
de los datos (decisión 056). Ahí
el mapa lleva una lupa, junto a ubicarme y ver en grande: al escribir filtra
lo que ya está cargado, y los pueblos se buscan al apretar un botón. En la
sección Caminos no va la ayuda de colores y líneas. En la lista de Marcas,
la casilla de cada marca va en verde suave y la de toda la categoría en verde
lleno, para distinguir tildar una de tildar todas (Ale, 2026-10-15). Esa lista
se achica a lo que entra en el mapa: al acercarse o moverse, lo que quedó
afuera deja de listarse (decisión 057). En Marcas, el filtro de actividad
conserva el centro y el zoom del mapa: elegir otra
actividad, «Todas» o repetir la elegida no lo mueve (decisión 073).
Arriba del panel de Marcas hay
tres opciones de líneas: nada, las zonas tildadas, o esas zonas y sus
sectores (decisión 059). La navegación libre no dibuja sectores. Al marcar
un punto o un trazo desde la navegación, el mapa que queda arriba se centra
en el GPS, se cierra con una X o con el botón de atrás, y el trazo se dibuja
recién al apretar «Comenzar a dibujar» (decisión 061). Ese formulario usa
el mismo panel que el resto: cabecera y colores compartidos. En la navegación
libre, el círculo de Caminos abre la ventana de siempre para elegir qué
actividades se ven: vienen todas prendidas (decisión 062). Al hacer clic o tocar una zona aparece una ficha
breve con acceso al detalle tocando cualquier parte de la ficha; el detalle
de la zona sigue mostrando sus sectores. Los nombres y
los íconos de los puntos aparecen gradualmente al acercarse; con poco zoom casi
no se muestran y los íconos que se pisan se ocultan. Ver
`decisiones/029-mapa-general-de-cordoba.md`. En cualquier mapa, tocar un punto
abre su ficha con el nombre del ícono, el comentario y la foto disponible. En
PC, el cursor cambia a una mano al pasar por encima.

### Partes de una ruta en el mapa

Cada parte combina dos señales independientes: el **color** expresa su
complejidad local (verde, amarillo, rojo o gris si todavía no se clasificó),
y la **forma de la línea** expresa cómo se pasa. Por explorar va entrecortada,
transitable va continua, a pie con equipo va continua con triangulitos chicos
(parecidos a las X, pero más pequeños), y sin paso conserva su
línea con X negras. Esas X se achican al alejarse, como el resto de las
marcas: de lejos no se amontonan en una mancha. Una X no vuelve roja la línea
por sí sola. Al tocar un Camino —en Consultas, en la navegación libre y al
navegar un Circuito— se abre la misma ficha: arriba dice Consulta Camino y
cada dato va aparte, con su nombre y su valor. La
valoración de esfuerzo y dificultad técnica de la ruta completa queda en su
ficha y no interviene en el dibujo. Ver decisiones 033 y 063.

### Dibujo de Circuitos en computadora

El Circuito se marca directamente, punto por punto, sin pedir que primero se
elija un Camino. Si dos puntos consecutivos caen sobre el mismo Camino, la
línea del Circuito sigue ese Camino; si el siguiente cae fuera, se separa y
continúa hacia el punto libre. No hay dos herramientas entre las que alternar
para «usar Camino» o «dibujar parte propia». Ver decisión 044. Las notas
explicativas de un boceto se muestran fuera de la pantalla de la app, con un
tratamiento visual distinto y una etiqueta explícita de que no se publicarán.

La parte marcada libremente en un Circuito va con línea continua negra en
modo sol y blanca en modo noche: no recibe una clasificación de Camino. La
parte tomada de un Camino conserva sus colores y marcas de exploración y
paso. Al armar el Circuito se elige una actividad y se puede mostrar Caminos
de una o varias; al pasar el mouse, el Camino indica todas sus actividades.
Ver decisión 046.

Debajo del mapa, el detalle de todo Circuito muestra siempre un resumen
escrito. Distingue lo dibujado libremente de lo tomado de Caminos, expresa
porcentajes sobre el largo total, y detalla exploración, forma de pasar,
complejidad y partes sin unir. Cuando cambia la información de un Camino,
el resumen se actualiza; no se abre un modal ni aparece un cartel superpuesto.
Ver decisión 047.

Si el Circuito terminaba en la punta de un Camino corregido, su final queda
en el lugar marcado originalmente. Si la nueva línea del Camino ya no lo
alcanza, el mapa muestra la separación y el resumen indica «Partes sin unir»;
no se dibuja una conexión supuesta. Ver decisión 048.

Al navegar un Circuito, el círculo de Información abre una ventana con ese
título. Adentro van el nombre, una miniatura de la línea vista desde arriba
con los colores y las marcas de cada tramo, el largo y dónde estás, y el
gráfico de alturas. La ayuda de colores y líneas no está siempre a la vista:
se abre con el círculo de ayuda, del tamaño normal, y se cierra al tocarlo
de nuevo. Ver decisión 067.

Al navegar un Circuito, «Circuitos en el mapa» se lee en tres partes: el
sector, elegido por su nombre; el Circuito que se está haciendo, aparte y
sin tilde; y los otros de ese sector. No abre un mapa adentro de la ventana.
Ver decisión 068.

---

## Por qué el modo oscuro es un error con sol

La intuición dice que con sol conviene pantalla oscura, para que no encandile.
Es al revés.

Con sol directo, la luz del ambiente es muchísimo más fuerte que lo que la
pantalla puede emitir. Un fondo negro no tiene con qué competir: el reflejo del
sol sobre el vidrio tapa el poco brillo que hay y el texto blanco se pierde. Un
fondo claro, en cambio, emite y refleja mucha más luz total, y el texto oscuro
se recorta contra ella.

**Regla: sol = fondo claro con texto oscuro. Noche = fondo oscuro con texto claro.**

## Por qué el cambio tiene que ser manual

El modo automático del celular va por horario o por sensor de luz ambiente, y
ninguno de los dos sirve acá. A las tres de la tarde podés estar bajo un árbol o
a pleno rayo, y el celular no distingue. El sensor tampoco: mide la luz que le
llega, no la que te pega a vos en la cara.

Además, en el cerro los cambios son bruscos: salís de un cañón sombrío a una
ladera abierta en veinte segundos.

**Regla: botón de cambio de modo, visible, a un toque desde el mapa.** No
enterrado en configuración, no automático.

### Cómo está hecho hoy (2026-09-19)

Los dos modos existen y el botón está en el encabezado y también abajo en la
pantalla de navegación, al alcance del pulgar. Arranca en modo noche y se
acuerda de lo que elegiste.

Tres reglas sostienen que los dos modos sigan siendo dos modos de verdad:

1. **Ninguna pantalla escribe un color.** Todos salen de las variables. Un color
   fijo en un lado del par fondo/texto deja letra clara sobre fondo claro en el
   otro modo.
2. **Las dos listas de variables tienen exactamente los mismos nombres**, línea
   por línea.
3. **Una prueba automática lo verifica en cada cambio**, junto con el contraste
   de cada combinación de texto y fondo, en los dos modos.

La tercera es la que importa. Que a un modo le falte un color no se nota leyendo
el código ni abriendo la app en casa: se nota en el cerro, cuando ya no se puede
leer la pantalla. Ver `decisiones/015`.

Dos excepciones a propósito: **el logo** mantiene sus colores en los dos modos,
porque una marca no se invierte; y **el color de arranque de la app instalada**
lo fija el sistema operativo al instalar y no puede cambiar con el modo.

---

## Por qué los números de contraste y tamaño

**Contraste 7:1 para texto normal.** Es el nivel más exigente del estándar de
accesibilidad web. Ese estándar está pensado para gente con baja visión en
condiciones normales de luz. Con sol directo, cualquiera tiene baja visión
funcional. Por eso se usa el máximo, no el mínimo.

**Botones: un solo tamaño, el normal.** Hasta el 2026-09-25 había un mínimo
de 56 píxeles de zona tocable, y 64 en navegación. Se sacó por decisión de Ale:
los botones grandes tapaban el mapa y entorpecían el uso. Ahora todo botón mide
lo mismo que en las pantallas de administración, también navegando. Ver
`decisiones/024-botones-de-tamano-normal.md`.

**16 píxeles de texto, 18 en navegación.** Leer moviéndose reduce la agudeza
visual: el ojo no se fija bien mientras el cuerpo se mueve.

---

## Gestos finos: sin regla de guantes

**Se sacó el 2026-09-24, decisión de Ale.** Los guantes dejaron de ser un caso
de diseño: ya no se exige que cada gesto fino (pellizcar, deslizar, mantener
apretado) tenga además un botón grande que haga lo mismo.

**No existe «tirar hacia abajo para recargar».** Chrome en el celular recarga
la página entera con ese gesto. Acá no sirve para nada —la app se pone al día
sola al abrir— y en el cerro un tirón sin querer recarga el mapa en el medio
de una navegación. La app lo ignora, igual que Vías de Escalada. Decidido por
Ale el 2026-09-21.

## Por qué todo va abajo

Sosteniendo el celular con una mano y caminando, el pulgar llega cómodo hasta
poco más de la mitad de la pantalla. Las esquinas de arriba exigen recolocar el
teléfono en la mano, lo que en un sendero es exactamente cuando se cae.

## Por qué se confirma antes de borrar

Una pantalla mojada registra toques que nadie hizo. Con lluvia o con sudor, una
acción destructiva sin confirmación se dispara sola.

---

## Por qué el mapa va a pantalla completa

La información que importa mientras caminás es: dónde estoy y por dónde sigue
el camino. Todo lo demás compite por espacio con eso.

**Consecuencia obligatoria:** si el mapa ocupa todo, tiene que haber una salida
visible y el botón físico de atrás tiene que funcionar. Un mapa a pantalla
completa sin salida clara es una trampa.

En la computadora, la tecla Escape hace lo mismo que la cruz de cerrar: cierra
la pantalla, el panel o la ventana que está adelante. El atrás del celular
también: si hay otra detrás, esa se queda. Decisión 064.

## Por qué sobre la foto van las líneas de paso

La foto satelital que se puede bajar no alcanza para ver un río o una huella.
En el mapa simple esas líneas se leen de una. En la navegación se dibujan
encima de la foto, sin pintar el color de la tierra, así la foto sigue
sirviendo para el terreno y las líneas dicen por dónde pasa el agua y el paso.

Al armar una zona, en cambio, la foto queda pelada: ahí se mira el terreno,
no el dibujo.

## Por qué la pantalla no se apaga navegando

Si la pantalla se apaga sola a los treinta segundos, la navegación no existe:
tenés que despertar el teléfono cada vez que querés mirar dónde estás.

**Contrapeso:** la pantalla encendida consume mucha batería. Por eso esto vale
solo mientras se está navegando activamente, no en toda la app.

## Por qué se avisa vibrando

Si te desviaste, lo más probable es que no estés mirando la pantalla — estás
mirando el sendero. Un cartel rojo que nadie ve no sirve de nada.

---

## Auditoría de fuentes

**Leído en tiempo real:** código de mapas, navegación, descarga offline y
componentes de TrackApp; reglas y documentación de Vías de Escalada Córdoba
(`AGENTS.md`, `docs/INSTRUCCIONES_DOCUMENTACION.md`, `docs/GLOSARIO_DOMINIO.md`,
`docs/ARCHITECTURE_MAP.md`, `design-qa.md`).

**Definido en conversación con Ale (2026-09-17):** situación de uso real, modo
claro/oscuro conmutable, mapa a pantalla completa. (Los botones grandes se
sacaron el 2026-09-25: decisión 024.)

**Pendiente de verificación:** los valores concretos de contraste, tamaño de
botón y tamaño de texto **no fueron probados al sol todavía**. Están fijados
según estándares de accesibilidad, no según prueba de campo. Hay que validarlos
con el celular afuera antes de darlos por definitivos.
