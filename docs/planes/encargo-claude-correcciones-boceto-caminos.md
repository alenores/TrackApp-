# Correcciones del boceto de Caminos para Claude

Trabajás en `C:\Users\Usuario\Desktop\TrackApp`. Leé primero
`AGENTS.md`, `docs/USUARIOS.md`, las decisiones 038, 039 y 041,
`docs/bocetos/caminos-en-mapas-notas.md` y el boceto existente
`docs/bocetos/caminos-en-mapas.html`.

Codex revisó el contenido del boceto y encontró tres diferencias concretas
respecto de decisiones ya confirmadas. **Corregí solo el boceto y sus notas**:

1. **Importación de puntos.** La vista ofrece decidir sobre un punto, pero el
   resumen, la habilitación de «Sumar al mapa» y el mensaje final cuentan solo
   Caminos y trazos. Debe poder completarse una importación que traiga **solo
   puntos**, sin exigir líneas. Debe contar los puntos elegidos en el resumen
   y en el resultado. El KML de Ascochinga sigue teniendo siete líneas y
   ningún punto; no presentes el punto de ejemplo como si viniera de ese
   archivo. Agregá una situación de ejemplo claramente separada para probar
   un archivo que sí trae puntos.
2. **Permisos de Anotaciones.** El boceto oculta la pestaña «Anotaciones» a
   Premium. La decisión de Alejandro permite a Administrador y Premium sumar
   puntos y trazos; Premium edita los propios y Administrador cualquiera.
   Mostrá el acceso correspondiente a Premium y sus acciones; si la pestaña
   también se muestra a Normal, que sea únicamente de consulta. No reutilices
   el permiso viejo de la app, que era solo para Administrador.
3. **Topes de texto.** Se aprobaron 120, 2.000 y 1.000 **caracteres** para
   nombre, descripción y observación. El boceto usa `texto.length`, que cuenta
   algunos símbolos Unicode dos veces, mientras la base los cuenta una sola.
   Alineá contadores y validación con la regla aprobada y usá «caracteres» en
   los mensajes.

Conservá el resto del diseño, las cinco vistas, los datos reales simplificados
de las siete líneas, los modos sol/noche y las decisiones visuales que todavía
debe revisar Alejandro. **No cambies ahora la actividad común de importación
ni tomes por aprobadas las otras decisiones visuales de tus notas**: esas
siguen pendientes de revisión de Ale.

## Límite

Editá únicamente `docs/bocetos/caminos-en-mapas.html` y
`docs/bocetos/caminos-en-mapas-notas.md`. No modifiques la app, el SQL, la base,
otros documentos ni archivos del prototipo. No hagas commit ni push.

## Verificación y entrega

Abrí el boceto y probá los tres casos anteriores, incluidos un archivo de
solo puntos, Premium y un nombre con símbolos Unicode. Comprobá las vistas en
modo sol y noche. Informá de forma breve qué corregiste y qué pudiste probar;
detenete ahí. Alejandro revisará el boceto antes de que se implemente una
pantalla.
