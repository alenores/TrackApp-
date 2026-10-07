# Encargo para Claude — boceto de importación y editor de Caminos

**Estado:** listo para entregar a Claude. Esta tarea prepara una pantalla para
que Alejandro la revise. **No implementa funciones en la app.**

Trabajás en `C:\Users\Usuario\Desktop\TrackApp`. Antes de crear nada, leé
`AGENTS.md`, `docs/DISENO_EXTERIOR.md`, `docs/GLOSARIO.md`,
`docs/planes/2026-10-05-mapas-caminos-circuitos.md` y las decisiones 034 a
041. Inspeccioná `git status`: hay cambios locales de varias etapas. No los
restaures, borres, reformatees, confirmes ni publiques. Mirá las pantallas
actuales de Mapas y el prototipo local de edición de partes de Ruta solo para
entender la apariencia existente; el destino nuevo es **Caminos dentro de
Mapas**, no agregar más funciones a Rutas. Si la app local está funcionando,
mirala en navegador para entenderla; no pidas credenciales ni cambies datos.

## Tu resultado

Creá **un boceto estático y navegable en un solo archivo HTML**:
`docs/bocetos/caminos-en-mapas.html`. Puede tener CSS y JavaScript dentro del
mismo archivo para pasar entre vistas y alternar modo sol/noche, pero **no debe
conectarse a la base, leer archivos reales ni tocar código de producción**.
Agregá `docs/bocetos/caminos-en-mapas-notas.md` con una explicación breve de
qué se ve, qué queda pendiente de decisión visual y qué detalles del boceto no
son aún funciones reales. No escribas un documento de arquitectura.

Mostrá en el boceto estas situaciones concretas:

1. **Mapa general de Mapas en PC.** Se ven Caminos, puntos y trazos de
   referencia. Hay una actividad principal elegida entre Trekking, Correr,
   Mountain bike, Kayak y Canyoning; la app recordará la última. Los Caminos
   que solo sirven para otras actividades siguen visibles y consultables,
   menos destacados. Tocar un Camino muestra su detalle.
2. **Importar KML/KMZ/GPX.** Después de elegir el archivo, se ve una vista
   previa de cada línea y punto por separado. Para cada línea se elige
   explícitamente **Camino**, **trazo de referencia** u **omitir**. Para cada
   punto se elige incorporarlo u omitirlo. No se decide por el color del KML y
   no se guarda el archivo original. Usá como ejemplo las siete líneas del
   proyecto de Ascochinga: no las fusiones en una línea de 73 km. El archivo
   de ejemplo no trae puntos; mostrales a Ale cómo se vería un punto si otro
   proyecto sí lo trae, indicando que es un ejemplo.
3. **Editor de un Camino.** Nombre, descripción, una o más actividades
   obligatorias y línea en el mapa. Se puede corregir la línea del mismo
   Camino; la corrección conserva la condición, complejidad, observación y
   fecha de cada parte que siga existiendo. Ninguna se reinicia sola.
4. **Editor de partes.** Elegir una parte sobre la línea y una actividad.
   Condición por actividad: por explorar, transitable, a pie con equipo, sin
   paso. Complejidad por actividad: sin clasificar, fácil verde, media
   amarilla, difícil roja. La forma de la línea indica condición: entrecortada,
   continua, puntos o X. Una X indica sin paso sin obligar al rojo. Al tocar la
   parte se leen todos sus datos, incluidos los de otras actividades. La
   observación y fecha son únicas para la parte y compartidas por actividades;
   la fecha no puede ser futura. Mostrá que cambiar esos datos no cambia la
   línea ni la condición.
5. **Permisos y estados.** Administrador y Premium pueden crear; Premium edita
   solo sus Caminos y Administrador cualquiera. Normal solo consulta. Un
   Camino retirado desaparece del mapa y no hay botón para recuperarlo. La
   interfaz deja claros estado vacío, carga y error con motivo y acción.

No confundas la complejidad local con esfuerzo o dificultad global de un
Circuito. No diseñes Circuitos ni Salidas en esta tanda. Zonas y sectores solo
sirven para descargar mapas: no asignes Caminos a una zona o sector.

## Reglas visuales obligatorias

- Pantalla pensada para **PC, con conexión**, como editor de administración.
- Modo sol claro con texto oscuro y modo noche oscuro con texto claro, mediante
  variables; comprobá ambos.
- Botones de tamaño normal, sin agrandarlos para el cerro.
- Textos breves en voseo argentino. Errores con motivo y qué hacer.
- Usá los nombres del glosario. Los textos visibles deben ser comprensibles
  para Ale sin saber programar.
- No llenes el mapa de nombres cuando está alejado; la vista previa permite
  enfocar una línea o un punto a la vez.
- El boceto debe ser **concreto para aprobar o corregir**, no una lista de
  alternativas abiertas. Si algo visual no está decidido, elegí una solución
  coherente y marcala en las notas para que Ale pueda confirmarla.

## Límite exacto

Solo podés crear o editar los **dos archivos** indicados bajo `docs/bocetos/`.
No toques `app/`, `components/`, `hooks/`, `lib/`, `scripts/`, otras partes de
`docs/`, el SQL, la base real, ramas de Git ni archivos locales del prototipo.
No hagas commit ni push. Si detectás un problema técnico, anotá la observación
en las notas del boceto; no lo arregles en esta tarea.

## Verificación y entrega

Abrí el HTML y comprobá que se ven todas las vistas, que funciona el cambio
sol/noche y que ningún control tapa el mapa por accidente. Entregá en español
una descripción breve y las rutas de los dos archivos. Decí qué decisiones
visuales querés que Ale revise. Detenete ahí: **Ale debe aprobar el boceto
antes de que alguien modifique las pantallas de la app**.
