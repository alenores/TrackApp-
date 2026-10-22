# 054 — Internet una vez por apertura

**Fecha:** 2026-10-13 · **Decidió:** Ale

## El problema

Cada cambio de pantalla salía a internet: el servidor armaba el molde de la
pantalla, volvía a revisar la sesión y varias pantallas le preguntaban a la
base qué tipo de usuario eras. La lista de Circuitos, el detalle de cada
Circuito y los avisos de mapas también le preguntaban a la base cada vez que se
entraba. En pantalla se veía la barrita de arriba moviéndose unos segundos.

## La decisión

**La app sale a internet al abrirse. Después, cambiar de pantalla no sale.**

- **Quién sos y tu tipo de usuario** se averiguan una vez, al abrir. Quedan
  guardados en el celular entre aperturas: abriendo sin señal se usa lo último
  que se supo. Si a alguien le cambian el tipo de usuario o cierra sesión con
  la app abierta, lo ve la próxima vez que la abra.
- **Circuitos, Navegación libre, Mapas con sus cuatro entradas y Zonas** quedan
  listas en memoria al abrir, con señal que sirve y después de poner los datos
  al día.
- **Salidas y Perfiles** no se piden al abrir. Se piden la primera vez que el
  usuario entra en esa apertura y después se reusan. Si no entra, no se piden.
- **Lo que pide una pantalla a la base** (la lista de Circuitos, el detalle de
  un Circuito, los mapas que tenías) se pide una vez por apertura.
- **Cuando vos guardás algo**, se olvida lo pedido y llega fresco: lo que
  acabás de cargar aparece al instante.
- **Los links no se precargan solos.** Si no, cada link a la vista pediría su
  pantalla aunque nadie lo toque.
- El mapa de Google sigue pidiendo su imagen a internet: es su naturaleza.
- El detector de señal que sirve (decisión 026) no cambia y es el que decide.

## Medido

Antes, entrar a Zonas tardaba entre 0,6 y 2,3 s esperando al servidor. Después,
con la versión de producción: Mapas, Zonas, Marcas, Descargas, Circuitos y
volver entre ellas, cero pedidos al servidor; Perfiles, uno la primera vez y
ninguno la segunda.

## Riesgo aceptado

El ajuste que guarda las pantallas en memoria está marcado como experimental
por el framework. Si fallara, vuelve a pedir al servidor como antes: no rompe
nada ni deja nada en blanco.

## Ampliación del 2026-10-22 (Ale)

Buscar, filtrar o tocar cualquier botón no le pregunta a la base: los datos
cambian cada semana o cada mes, no a cada rato.

- **Salidas** se trae entera una sola vez por apertura, junto con los usuarios.
  La lista, la ficha, cargar y editar, el calendario, el buscador y los filtros
  leen de ahí. Buscar y filtrar cambian la dirección sin pedirle nada al
  servidor.
- El archivo GPS de una salida se baja una vez: el gráfico de alturas y el mapa
  en grande usan el mismo.
- Los editores de Camino y de Circuito leen una vez; abrir editar desde los tres
  puntos usa el mismo pedido que el detalle del Circuito.
- Guardar o borrar olvida lo pedido, como siempre: lo nuevo llega fresco.

