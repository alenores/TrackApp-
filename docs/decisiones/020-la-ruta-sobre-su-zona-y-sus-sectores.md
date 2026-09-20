# 020 — La ruta se mira sobre su zona y sus sectores

**Fecha:** 2026-09-20 · **Estado:** vigente
**Completa la decisión 009 (cobertura de mapas de una ruta).**

---

## El problema que lo origina

La 009 resolvió **contar**: cuántos sectores cruza una ruta, cuáles están
bajados, cuántos kilómetros quedan sin mapa. Todo eso se decía con palabras y
números.

Pero un número no alcanza para decidir. «Te faltan 2,1 km de mapa» significa
cosas muy distintas si esos dos kilómetros son adentro de un pueblo o si son el
filo de la cumbre. **Eso no hay número que lo diga: se ve.**

Y faltaba un nivel entero: la **zona**. Una ruta que te pasa un amigo puede no
caer en ninguna zona tuya, caer en una, o cruzar cinco. Saberlo es lo que te
dice si el territorio por donde pasa ya está organizado o si hay que armarlo.

---

## Decisión

**La ruta se dibuja sobre su zona y sus sectores, con el mapa de internet
atrás.** Los tres niveles se leen de un vistazo, sin leer una palabra:

| Qué | Cómo se dibuja | Por qué |
|---|---|---|
| La ruta | línea verde | es lo que se mira |
| Zona | línea de puntos gris, sin relleno | es referencia, no promesa; rellenarla taparía el terreno |
| Sector bajado | verde, con relleno tenue | podés salir por ahí |
| Sector sin bajar | ámbar, con relleno tenue | te falta |

**Los números quedan al costado y son informativos, no un veredicto.** No hay
«esta ruta está lista» ni «esta ruta no sirve»: hay una ruta dibujada y la
persona decide mirando.

Junto a los renglones están los botones para armar lo que falte: bajar el mapa
de un sector, crear un sector donde hay hueco, o crear la zona cuando no hay
ninguna.

## Dónde aparece

En la pantalla de una ruta **y también al subirla**, antes de guardar nada. Ese
es el momento en que alguien mira un archivo que le pasaron y quiere saber si
cae adentro de lo que tiene organizado.

## Una zona no se mide, se muestra

Con los sectores sí se mide: la línea de la ruta se cruza contra cada rectángulo
y se cuentan los metros que quedan afuera. Con las zonas no. Se dibuja la que la
ruta toca y listo.

Es a propósito. La zona no promete nada —no se descarga, no se navega— así que
un porcentaje de zona cubierta sería un número exacto sobre algo que no cambia
ninguna decisión. **Lo que cambia la decisión es el sector, y ese sí se mide.**

## Todo mapa se abre en grande

En un celular cualquier mapa es chico, y mirar si la línea de la ruta queda
adentro de un sector en siete centímetros no se puede.

**Todos los mapas de la app tienen un botón para abrirlos a pantalla completa**,
abajo a la derecha, al alcance del pulgar. Se cierra con la cruz y también con
el botón físico de atrás. Al abrirse y al cerrarse **se vuelve a encuadrar lo
que hay que mirar**: conservar el acercamiento dejaría la ruta como una
estampilla en el medio de la pantalla grande.

La pantalla de navegar no lo lleva: ya está en grande.

## La referencia de colores va adentro del mapa

Sin ella los recuadros son manchas de colores. Va adentro y no al lado para que
viaje con el mapa cuando se abre en grande, y **solo nombra lo que está
dibujado**: explicar un color que no se ve confunde más de lo que ayuda.
