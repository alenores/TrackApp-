# 032 — Registrar una salida mientras se navega

**Decidido:** 2026-10-04 · **Mockup aprobado por Ale** · **Estado:** vigente

## El pedido

Mientras se navega una ruta o se usa la navegación libre, ir registrando la
salida en paralelo, para que después se arme sola: por dónde fuiste, y más
adelante las fotos con su lugar.

## Decisiones

**Salidas sigue siendo con internet, con una sola excepción: el registro en
curso.** Lo que se junta en el cerro se guarda en el celular, sin señal, y
sube solo cuando hay señal **y la navegación está cerrada**, por el mismo
camino que las anotaciones (decisión 023). Navegando no se sale a internet
nunca.

**Los puntos se anotan solos con la pantalla prendida**, más una banderita
«Marcar acá» para sumar uno a mano. Se anota una posición cada unos 20 metros,
si el GPS puede errar 50 metros o menos; parado, una cada 5 minutos. Con el
celular bloqueado o con otra app adelante el navegador no da posiciones: ese
tramo queda como una línea recta. Es una limitación de las apps web y se avisa
al empezar.

**Cada punto queda grabado en el momento.** Si el celular se apaga o se cierra
la app, no se pierde nada, y al volver a navegar se sigue la misma salida.

**Al empezar a navegar una ruta se pregunta** si registrar. Desde el mapa (de
la ruta o libre) también se puede empezar con un botón. Al salir del mapa con
una salida en curso: terminarla, o dejarla para seguir después. Desde la lista
de salidas también se puede terminar.

**Lo registrado sube como borrador**, que solo ve quien lo hizo (la base lo
exige) hasta que lo completa y toca «Publicar». El borrador lleva el día, la
ruta navegada y sus actividades, el recorrido como archivo GPX (así usa todo lo
que ya existe para un archivo GPS) y el largo y el desnivel calculados. Sin
alturas del GPS, el desnivel queda vacío. Un código del celular evita que una
subida cortada cree dos borradores.

## Etapas

1. Botón flotante de navegar en el celular. **Hecho.**
2. Registro en curso, borrador y publicar. **Hecho.**
3. Fotos con su lugar durante la navegación, que no son anotaciones.
4. Las fotos sobre el mapa del recorrido, en la ficha.

## Dónde vive

Las reglas (cuándo anotar, el GPX, el título del borrador) en
`lib/salidas/registro-reglas.ts`; lo guardado en el celular en
`lib/salidas/registro.ts`; la subida en `lib/salidas/subir-registros.ts`. Las
tres con pruebas.
