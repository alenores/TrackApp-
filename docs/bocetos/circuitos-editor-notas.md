# Editor de Circuitos: boceto guiado para revisión

**Estado:** segunda propuesta de Codex, 2026-10-07. No está aprobada por Ale.
Reemplaza el primer dibujo de la misma página, que Ale encontró inentendible y
visualmente anticuado. No cambia la app, no consulta datos y no guarda nada.

## Qué se intenta mostrar

El Circuito se arma en tres pasos visibles en la parte superior de la página:

1. **Entender.** Una pantalla breve explica con ejemplos qué se puede hacer:
   usar un Camino del mapa, dibujar una parte propia y revisar el Circuito
   antes de salir. No exige interpretar controles antes de conocer el objetivo.
2. **Armar.** El mapa ocupa el lugar principal y el costado ofrece dos acciones
   alternativas. Para usar un Camino, se toca su línea; después se elige usar
   todo o marcar inicio y final sobre la misma línea. Para dibujar, se tocan
   puntos sobre el mapa y se termina la parte. Debajo aparecen las partes
   incorporadas, en orden, con botones normales para moverlas o quitarlas.
3. **Revisar.** Se muestra el Circuito armado, se escribe el nombre y se ven
   los avisos. Una separación entre partes se indica como **«Partes sin unir»**:
   no se dibuja un enlace inventado ni se bloquea guardar. Un botón del boceto
   simula la corrección de un Camino para mostrar el otro aviso previo.

La línea azul representa el Circuito completo sin crear otro Camino en Mapas.
La procedencia de cada parte figura en la lista: tomada de un Camino o dibujada
solo para este Circuito. El color y estilo de los Caminos marcados se mantienen
en el mapa de ejemplo para recordar que siguen siendo contenido de Mapas.

## Qué está decidido y qué está propuesto

**Decidido por Ale:** los Circuitos pueden mezclar partes de Caminos y partes
propias; no modifican Mapas; los tramos tomados siguen las correcciones de su
Camino; se avisa antes de salir; un Circuito con partes sin unir se puede
guardar y muestra un aviso. El nombre del concepto es **Circuito**, no un
sinónimo introducido por el agente.

**Propuesta visual de Codex, pendiente de Ale:** recorrido de tres pantallas,
ubicación de botones, elección directa de extremos sobre el mapa, línea azul
para el Circuito, lista ordenada debajo del mapa y avisos al revisar.

**Pendiente de decisiones de producto:** una o varias actividades por
Circuito, repetir una porción de Camino, comportamiento de Caminos retirados o
reclasificados, relación con Salidas y alcance final de los datos globales. El
boceto no muestra controles para esas decisiones todavía.

## Límites del ejemplo

- El fondo del mapa, sus Caminos y sus puntos son inventados. Sirven para
  explicar la interacción; no son datos de Ascochinga.
- La longitud y la distancia entre partes se miden en el dibujo de ejemplo,
  solo para mostrar un aviso. La app real deberá calcularlas sobre el terreno.
- La corrección simulada mueve un punto de un Camino del ejemplo; no demuestra
  todavía el algoritmo definitivo para mantener exactamente sus extremos.
- «Guardar Circuito» muestra un mensaje y no escribe datos. Recargar reinicia
  el ejemplo.
- La revisión visual automatizada de archivos `file:` fue rechazada por la
  política del navegador; se comprobó la sintaxis del JavaScript, pero hace
  falta la revisión visual y de clics de Ale. Eso es parte de la aprobación
  previa a tocar las pantallas de la app.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034, 037, 042 y 043; glosario; reglas de diseño exterior; primer boceto y crítica concreta de Ale.
- **Inferido:** separar las acciones en tres pasos reduce la cantidad de controles simultáneos y hace visible por qué se usa cada uno.
- **Pendiente de verificación:** revisión de Ale, informe técnico de Claude en lo relativo a extremos vinculados y ejecución del editor real.
