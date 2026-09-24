# 019 — La foto de la anotación viaja con el mapa del sector

**Fecha:** 2026-09-20 · **Estado:** reemplazada por la 023 (2026-09-24)
**Completa la decisión 010 (anotaciones) y la 012 (modelo de descarga).**

---

## El problema que lo origina

La anotación con foto existe **para un momento muy preciso**: la persona está
parada en el cruce, sin señal, mirando dos senderos que arrancan iguales. La
foto le dice cuál es. El mapa dice dónde; la foto dice cómo.

Recién construida, la foto se guardaba en la base y se mostraba desde internet.
Eso la volvía inútil justo cuando hace falta: en el cerro no hay señal, y una
foto que solo se ve en casa no resuelve nada.

Había además una trampa más fina. Aunque el texto y las coordenadas de las
anotaciones viajan siempre con el paquete, **una foto no es texto**: pesa. Meterla
en la actualización automática del paquete habría hecho que la app se bajara
megas de fotos sola, sin que nadie lo pida, cada vez que alguien agrega una.

---

## Decisión

**La foto baja junto con el mapa del sector.** Cuando el usuario elige bajar el
mapa de un sector —el único momento en que la app le pide permiso para gastar
datos— bajan también las fotos de las anotaciones de ese sector.

- En el cerro, la foto **se lee del celular**. Nunca de internet, por ningún
  motivo. Si no está bajada, la pantalla lo dice con todas las letras y explica
  qué hacer: no queda un recuadro vacío que haga pensar que la foto no existe.
- Las fotos se guardan **por su dirección**, no por número de anotación. Cambiar
  la foto de una anotación cambia su dirección, así que la nueva se baja sola y
  la vieja queda marcada como sobrante: nadie tiene que llevar la cuenta de
  versiones.
- Sacar el mapa de un sector **libera también sus fotos**, con el mismo criterio
  que los pedazos de mapa: se dice qué sigue haciendo falta y se va el resto, así
  no se lleva puesta la foto del sector de al lado.

## Una foto que falla no traba el mapa

El mapa es una promesa: **sector en verde quiere decir que se puede navegar con
fondo**. La foto es un extra.

Si una foto no entra —se cortó la señal, el archivo ya no está— el sector queda
bajado igual y se dice cuántas fotos faltan y por qué. Trabar el mapa entero por
una foto colgada sería cambiar un problema chico por uno grave: el usuario se
quedaría sin mapa.

Lo que **no** se hace nunca es decir que la foto está cuando no está.

## Una foto agregada después también se sabe en casa

El caso que más se iba a repetir: el mapa del sector ya está bajado y después se
le agrega una foto a una anotación.

Cada mapa bajado **se acuerda de qué fotos trajo**. Comparando esa lista contra
las anotaciones del paquete, la app responde al instante, sin ir al depósito
grande y sin internet, la única pregunta que importa: ¿le falta bajar alguna
foto a este sector? Si falta, lo dice en la ruta y en el sector, con un botón
para bajarlas. Los pedazos de mapa ya están, así que es solo la foto.

**Se sabe en casa, con señal. En el cerro no hay sorpresas.**

---

## Lo que se descartó

**Dejarlo en manos del guardado automático del navegador.** La app ya guarda por
su cuenta las imágenes que se ven una vez. Alcanzaba con abrir la foto en casa
para que quedara. Se descartó por dos motivos: el navegador puede tirar ese
guardado cuando quiere y sin avisar, y sobre todo **no se puede verificar**. La
app no podría comparar lo que pidió contra lo que quedó, y entonces no podría
prometer nada sin mentir.

**Bajar las fotos con el paquete.** Habría gastado datos sin que nadie lo pida,
cada vez que alguien agrega una foto. Lo que pesa lo elige el usuario.
