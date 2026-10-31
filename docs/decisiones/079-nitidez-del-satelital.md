# 079 — Nitidez del satelital sin conexión

**Fecha:** 2026-10-30 · **Estado:** vigente (el sombreado queda a decisión de Ale)

> **Leer esto antes de volver a investigar.** Ale preguntó si el satelital
> descargado podía verse tan nítido como Google Earth. Se investigó con
> mediciones y capturas reales en Los Gigantes. Todo lo de abajo ya está
> respondido; volver a buscarlo en internet es gastar uso al pedo.

## Por qué hoy se ve borroso

- La foto es **Sentinel-2 sin nubes de EOX**: **10 m por punto**.
  Se ven bosques, agua y paredes de roca; no un sendero ni un refugio.
- Se baja hasta el **acercamiento 15** (unos 4 m por punto en Córdoba). Más
  cerca, el mapa estira esa foto.
- **Bajar más acercamientos de esta foto no sirve**: ya se baja más fino que lo
  que la foto tiene. Solo sumaría peso.
- Peso medido, sector de 6 × 4 km en Los Gigantes: unos 62 pedazos de 11 a
  17 KB, **≈ 0,7 MB**.

## La foto nítida que existe: Esri (Vantor, ex Maxar)

- En el cerro Mogote (-31,4188, -64,8061) Esri tiene foto de **0,34 m por
  punto, del 7-9-2025**, servida hasta el acercamiento 18. Es la misma familia
  de fotos que usa Google. Ver `079-imagenes/foto-hoy-vs-esri-z17.jpg`: la
  diferencia es enorme (bloques de roca, piedras, construcciones).
- Peso estimado del mismo sector: **≈ 9 MB** hasta el acercamiento 17 y
  **≈ 28 MB** hasta el 18 (pedazos medidos de 13 a 19 KB).

## Por qué no se usa (ninguna opción entra)

| Opción | Resultado |
|---|---|
| **Esri, capa común** | Su licencia dice textualmente que **no es para bajar pedazos para uso sin conexión**. |
| **Esri, capa «para exportar»** | Requiere cuenta (la de desarrollador es gratis) y permite uso sin conexión **solo en aplicaciones de Esri o hechas con sus herramientas**. TrackApp no lo es. Además el puente propio (decisión 017) se parece a redistribuir. |
| **Mapbox** | Sin conexión solo con sus herramientas para apps de celular; prohíbe redistribuir. |
| **MapTiler y licencias pagas** | **Descartadas por costo** (Ale, 2026-10-30: «ya se averiguó y es carísimo»). |
| **Google** | Prohibido (decisiones 007 y 050). |
| **OpenAerialMap** (fotos libres de drones y aviones) | Consultado: **cero fotos** en Los Gigantes. |
| **Foto de alta resolución de IDECOR** | Según la decisión 007 cubre localidades y no la sierra. No se volvió a verificar. |
| **Aviso en Descargas del detalle que tiene la foto** | **Rechazado por Ale**: no aporta. No volver a proponerlo. |

**Conclusión:** con las tres condiciones de Ale —gratis, legal y sin conexión—
**no hay foto más nítida que Sentinel-2 para la sierra.** Usar Esri «porque
anda» repite el error de OpenStreetMap (decisión 007): pueden cortarlo sin aviso.

La sugerencia de otro asistente («cambiar a una fuente gratis más nítida o a
Esri abierto, sin tocar lo de arriba») es correcta en lo técnico —la foto vive
en un solo lugar y las líneas, Caminos y curvas no se tocan— pero **no existe
esa fuente**: «Esri abierto» para guardar en el celular no hay.

## Lo que sí se puede: sombreado con la altura de 5 m de IDECOR

- IDECOR publica la altura del terreno a **5 m por punto**, gratis, por un
  servicio estándar:
  `https://idecor-ws.mapascordoba.gob.ar/geoserver/idecor/wcs`, capa
  `idecor__dem_5m_cba_ext` (sistema original EPSG:22174, entrega en EPSG:3857
  y en texto con `format=text/plain`; sin dato = 32767; alturas en metros
  enteros). Hay también `dem_ign_v2_cba_ext` y `dem_merit_cba_ext`.
- Hoy la app usa otra altura, de **30 m** (Mapterhorn/Copernicus, decisión 013).
- Prueba en Los Gigantes: foto actual + sombreado de 5 m. Ver
  `079-imagenes/sombreado-z15.jpg` y `sombreado-z17.jpg`.
  - **A distancia de sector (acercamiento 15) mejora claramente**: filos,
    quebradas y arroyos se leen mucho mejor.
  - **De cerca (17) ayuda poco**: marca bloques grandes, pero no se acerca a
    la foto de Esri.
  - Aparecen **líneas rectas y escalones** en el dato crudo.

### Diagnóstico del sombreado (2026-10-31)

- **Las líneas rectas vienen del dato de IDECOR, no de la prueba.** Se bajó
  con otras dos formas de conversión y aparecen igual. Ese dato tiene zonas de
  distinta calidad: en Los Gigantes se ve un corte vertical entre una zona
  lisa y otra rayada (como dos mosaicos unidos). Además las alturas vienen en
  metros enteros, lo que agrega escalones en lo plano. Las esquinas vacías
  del recorte, en cambio, eran un efecto de la prueba.
- **Se limpian suavizando apenas el dato** (suavizado gaussiano de 1 punto).
  Más suavizado borra las líneas pero también la ganancia y queda igual que
  el de 30 m. Ver `079-imagenes/sombreado-cuatro-versiones-z15.jpg` y
  `sombreado-final-z15.jpg` (hoy · 30 m · 5 m limpio).
- **Comparación a distancia de sector:**
  - **30 m** (el dato que la app ya baja): mejora poco; marca valles y
    laderas grandes. No suma ni un byte.
  - **5 m limpio:** mejora claramente; se leen filos, quebradas y arroyos.
  - De cerca (acercamiento 17) ninguno de los dos cambia mucho.
- **Peso medido:** el dato de 5 m guardado igual que el relieve actual
  (imagen sin pérdida) pesa **≈ 12 KB por km²**: un sector de 6 × 4 km,
  **≈ 0,3 MB**. Es liviano.
- **Cobertura:** el dato de 5 m es solo de la provincia de Córdoba. Fuera de
  Córdoba habría que usar el de 30 m.
- **El borde del sector** (lo que hizo sacar el sombreado en septiembre): sin
  probar en la app. La idea es bajar una franja extra de relieve alrededor del
  sector para que el borde no se corte; pesa poco.

## Pendiente

- **Decisión de Ale:** ¿se suma el sombreado, con el dato de 5 m limpio en
  Córdoba y el de 30 m afuera?
- Si se suma: probar el borde del sector en la app y verlo al sol en un
  celular.

## Auditoría de fuentes

**Leído en tiempo real (2026-10-30):** código de la foto satelital, del puente
satelital y de la grilla de pedazos; decisiones 007, 013 y 017; registro de
sesiones; pedazos reales de EOX y Esri en Los Gigantes; datos de la foto de Esri
en el Mogote; licencias de Esri en sus fichas oficiales
([World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9),
[World Imagery for Export](https://www.arcgis.com/home/item.html?id=226d23f076da478bba4589e7eae95952));
catálogo de OpenAerialMap; servicio de altura de IDECOR (dato crudo y con dos conversiones); pedazos de
relieve de 30 m de Mapterhorn que usa la app.

**Inferido (no verificado):** términos de Mapbox (de su documentación de uso
sin conexión, no del contrato); cobertura de la foto de IDECOR (de la decisión
007); pesos con Esri (pedazos medidos por un sector estimado).

**Pendiente de verificación:** el borde del sector con sombreado, en la app.
