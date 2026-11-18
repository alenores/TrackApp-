# 084 — Autoría del nivel real de imágenes de Google

**Fecha:** 2026-11-18 · **Estado:** implementada y verificada; publicación en producción autorizada por Ale

## Qué se investigó y qué se comprobó

Después de publicar la caché (712ab93), abrir dos veces la Salida 21 produjo
seis mensajes «Google respondió sin créditos para la imagen». La ruta devolvía
HTTP 200: el campo copyright venía vacío en los niveles 12, 11 y 10; el nivel 9
entregaba NASA. No eran seis errores HTTP ni una secuencia infinita.

Ale pidió determinar primero si la causa estaba en TrackApp o en Google.
Si era propia, corregirla; si el proveedor devolvía vacío ante un pedido correcto,
no encadenar reintentos. Una consulta corresponde a una vista concreta.

La prueba local de la misma versión publicada confirmó una discrepancia propia:
la consulta de autoría enviaba 12 mientras las imágenes solicitadas eran de nivel
14. Manteniendo la misma sesión y los mismos límites geográficos, el control
directo contra Google produjo:

| Nivel consultado | HTTP | copyright |
|---|---:|---|
| 12, enviado por TrackApp | 200 | Cadena vacía |
| 14, nivel real de las imágenes | 200 | Imágenes ©2026 Airbus, CNES / Airbus, Landsat / Copernicus, Maxar Technologies |

La comparación cambió únicamente el nivel. Los límites cumplían los rangos
publicados y la ruta no eliminaba el texto del proveedor. Esto confirma una
causa propia para el caso reproducido; no declara que cualquier respuesta vacía
en cualquier zona sea un error nuestro o del proveedor.

## Decisión e implementación

MapLibre usa otra escala para el acercamiento de cámara. La fuente Google tiene
imágenes de 256 píxeles; la cámara usa una base de 512 y el raster redondea el nivel.
Por eso floor(getZoom()) no identifica las imágenes reales.

La corrección toma los niveles canónicos de la cobertura mediante la API pública
Map.coveringTiles, configurada igual que la fuente Google (256, raster redondeado,
niveles 0 a 22). La consulta de autoría y las imágenes deben coincidir. El máximo
informado por Google también se interpreta en la unidad correcta, manteniendo
la regla de no alejar automáticamente una vista ya abierta.

Cada vista hace una sola consulta de autoría. Se elimina el descenso a otros
niveles para buscar cualquier texto: NASA obtenido en 9 no prueba la autoría de
una fotografía de 14. Si el pedido correcto vuelve vacío, se conserva el resultado
pendiente y el aviso existente; no se inventa autoría ni se encadena otra búsqueda.
Una respuesta obsoleta no reemplaza la de una vista nueva.

No se interpreta que una única consulta equivalga por sí sola a cumplir las
condiciones de Google: la autoría correspondiente debe mostrarse cuando se recibe.

## Verificación

TypeScript y compilación correctos; lint sin errores ni advertencias nuevas
(16 preexistentes). Las 140 suites y 1185 pruebas pasan. Las 28 pruebas específicas
cubren cobertura canónica, tope 22 aunque haya ampliación, cobertura vacía/mixta o
inválida, conversión de máximo sin retroceso, respuesta vacía sin descenso y descarte
de respuestas obsoletas.

En la copia compilada, la Salida 21 pasó de cuatro consultas de autoría (12, 11, 10,
9) a una sola en 14. La pantalla mostró Airbus, CNES / Airbus, Landsat / Copernicus
y Maxar Technologies. Las 40 imágenes iniciales también fueron de 14. Al reabrir,
se hizo una consulta de autoría en 14 y cero descargas de imágenes repetidas. Al
acercar otro nivel, las 15 imágenes nuevas y la única consulta de autoría coincidieron
en 15. Todas esas respuestas fueron HTTP 200 y no hubo mensajes de autoría vacía.
No se editaron ni guardaron datos de la cuenta.

Después de revisar el resultado, Ale autorizó expresamente publicar la corrección en producción mediante GitHub y Vercel.

## Auditoría de fuentes

**Leído en tiempo real:** components/mapa/mapa.tsx; lib/mapas/google-acercamiento.ts;
lib/mapas/google-cliente.ts; app/api/mapa-google/atribucion/route.ts;
MapLibre 6.10.0 instalado (covering_tiles.ts, raster_tile_source.ts y API Map.coveringTiles);
https://developers.google.com/maps/documentation/tile/2d-tiles-overview;
https://developers.google.com/maps/documentation/tile/session_tokens;
https://developers.google.com/maps/documentation/tile/policies.
Prueba local del mapa Salida 21 y dos controles directos de Google, con la misma
sesión y área, sin mostrar claves ni escribirlas en el repositorio.

**Inferido:** al alinear la autoría con el nivel real se evitan los descensos
observados en este caso. No se asigna un costo a este comportamiento ni se lo
usa para explicar retrospectivamente el pico del 2 de noviembre.

**Pendiente de verificación:** publicación; otras
zonas pueden tener respuestas diferentes y deben conservar el comportamiento
acotado de una consulta por vista.
