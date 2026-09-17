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
- **Con guantes**, cuando hace frío o hay roca.
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

---

## Por qué los números de contraste y tamaño

**Contraste 7:1 para texto normal.** Es el nivel más exigente del estándar de
accesibilidad web. Ese estándar está pensado para gente con baja visión en
condiciones normales de luz. Con sol directo, cualquiera tiene baja visión
funcional. Por eso se usa el máximo, no el mínimo.

**56 píxeles de zona tocable, 64 en navegación.** La recomendación habitual para
dedo desnudo es 48. Un guante agrega imprecisión: el punto de contacto se corre
y se agranda. Se sube el número en vez de confiar en la puntería.

Importante: el **botón puede verse más chico** que su zona tocable. Lo que no
puede achicarse es la zona que responde al toque.

**16 píxeles de texto, 18 en navegación.** Leer moviéndose reduce la agudeza
visual: el ojo no se fija bien mientras el cuerpo se mueve.

---

## Por qué nada de gestos finos

Con guantes no se puede pellizcar para hacer zoom, y mantener apretado medio
segundo es poco confiable. Deslizar funciona a medias.

**Regla: todo gesto fino tiene que tener un botón grande que haga lo mismo.** El
gesto se puede dejar como atajo para quien tiene la mano libre, pero nunca puede
ser la única forma de hacer algo.

## Por qué todo va abajo

Sosteniendo el celular con una mano y caminando, el pulgar llega cómodo hasta
poco más de la mitad de la pantalla. Las esquinas de arriba exigen recolocar el
teléfono en la mano, lo que en un sendero es exactamente cuando se cae.

## Por qué se confirma antes de borrar

Una pantalla mojada registra toques que nadie hizo. Con lluvia o con sudor, una
acción destructiva sin confirmación se dispara sola.

---

## Por qué el mapa va a pantalla completa

La información que importa mientras caminás es: dónde estoy, por dónde sigue el
camino, y si me desvié. Todo lo demás compite por espacio con eso.

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
claro/oscuro conmutable, botones grandes por guantes, mapa a pantalla completa.

**Pendiente de verificación:** los valores concretos de contraste, tamaño de
botón y tamaño de texto **no fueron probados al sol todavía**. Están fijados
según estándares de accesibilidad, no según prueba de campo. Hay que validarlos
con el celular afuera antes de darlos por definitivos.
