# Boceto del editor de Circuitos: notas para revisión

**Estado:** borrador de Codex del 2026-10-07. Todavía no aprobado por Alejandro.
El archivo `circuitos-editor.html` es una página de ejemplo independiente; no
se conecta a la app, no guarda en la base y no modifica Caminos.

## Cómo mirarlo

Abrí `circuitos-editor.html` desde esta carpeta. Probá tocar un Camino gris,
usar una parte, dibujar una parte propia sobre el mapa y cambiar el orden.
Después probá «Simular un Camino corregido» y «Guardar Circuito». La barra
superior con borde punteado solo existe en el boceto.

## Qué representa

- **Decidido por Ale:** un Circuito puede mezclar partes tomadas de Caminos y
  partes propias; hacerlo no altera el mapa. El Camino incorporado sigue sus
  correcciones. Se avisa antes de salir. Un Circuito con partes sin unir se
  puede guardar con un aviso, sin dibujar una unión inventada.
- **Propuesta visual de Codex para revisar:** panel con los datos del Circuito a
  un lado, mapa al otro, lista ordenada de partes debajo, dos botones para
  agregar partes y avisos encima. La línea del Circuito se superpone a las
  alternativas del mapa con un color propio; las partes dibujadas se distinguen
  de las tomadas de un Camino. El color de un Camino sigue comunicando su
  complejidad local en la app real; este dibujo simplificado usa gris para
  centrarse en la composición del Circuito.
- **Todavía por decidir:** actividad única o múltiple del Circuito, repetición
  de una misma porción, reglas exactas para elegir extremos, datos globales,
  tratamientos de Camino retirado o «sin paso» y relación con Salidas. El
  ejemplo muestra una actividad y permite repetir porciones, pero eso no
  significa que estén aprobadas esas opciones.

## Límites del ejemplo

Los Caminos y lugares del fondo son inventados. Solo se puede elegir tres
Caminos precargados. Los controles de porcentaje de inicio y fin demuestran la
idea de tomar una porción; no son el gesto final propuesto para la app. El
dibujo propio se arma tocando el mapa; el ejemplo no calcula largo, esfuerzo,
desnivel ni mapas faltantes. La separación se detecta en unidades del dibujo,
solo para mostrar el aviso. La corrección simulada cambia una parte de un
Camino sin persistencia. Al recargar, el ejemplo se reinicia.

## Verificación

Se comprobó la sintaxis del JavaScript del boceto con `node --check`. La
herramienta de navegador rechazó abrir la URL local por su política de
seguridad; no se hizo una revisión visual automatizada ni una prueba de clics.
Ale debe poder abrir el archivo local desde su explorador de archivos para
revisar la propuesta. La implementación visual espera esa revisión.

## Auditoría de fuentes

- **Leído en tiempo real:** decisiones 034-043, plan de separación, boceto aprobado de Caminos y reglas de diseño exterior.
- **Inferido:** el panel y la lista ordenada facilitan distinguir Circuito, alternativas y espacios sin unir sin introducir un nuevo Camino.
- **Pendiente de verificación:** respuesta de Ale a las decisiones abiertas, revisión visual del boceto, informe técnico de Claude y comportamiento real cuando se implemente.
