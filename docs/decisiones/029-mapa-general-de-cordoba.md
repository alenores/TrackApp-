# 029 — Mapa general de Córdoba

> Decidido: 2026-10-01 · Mockup aprobado por Ale

## Decisión

El módulo **Mapas** tiene dos pestañas: **Zonas**, con la lista de siempre, y
**Mapa**, con una vista general de Córdoba. La vista del mapa abre encuadrando
la provincia y muestra todas las zonas y las anotaciones de tipo punto.

En el mapa general, cada zona se dibuja solo con su perímetro y un nombre. No se
dibujan los límites internos ni los nombres de sus sectores. Al pasar el cursor
sobre la zona, o tocarla por primera vez, aparece una ficha breve con su nombre,
cantidad de sectores, descripción si tiene, y el acceso **Ver zona**. Ese acceso
abre el detalle existente, donde sí se ven todos los sectores y sus datos.

El rótulo se reduce al alejarse y recupera su tamaño normal al acercarse. En
computadora, la ficha se cierra enseguida al sacar el cursor; un clic la deja
fija para poder usar **Ver zona**. En celular, el primer toque la deja fija y se
cierra al tocar afuera o en **Cerrar**.

Los perímetros usan los rectángulos reales de las zonas. El mockup mostraba la
idea visual, pero no cambia cómo se guardan las zonas.

## Motivo

Al abrir una zona aislada cuesta entender dónde queda en Córdoba y qué otras
zonas la rodean. Varias cuadrículas sectoriales juntas taparían el mapa y sus
puntos. La vista general debe dar contexto territorial; el detalle concentra
la información de cada zona.

## Auditoría de fuentes

- Leído en tiempo real: pedido y aprobación de Ale, mockup elegido, captura de
  la zona Champaquí, componentes actuales de zonas, mapa y anotaciones.
- Inferido: usar los rectángulos de zona ya existentes para el perímetro y
  mantener los sectores en la pantalla de detalle.
- Verificado: mapa local abierto con sesión iniciada, rótulos comprobados en
  escritorio en ambos modos y con distintos niveles de acercamiento; cierre del
  hover cubierto por prueba automática.
