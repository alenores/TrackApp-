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

Cada regla sale de una de esas seis condiciones. Si una regla no se puede
justificar contra una de ellas, sobra.

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
