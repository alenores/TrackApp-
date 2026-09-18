# 007 — De dónde salen los mapas

**Fecha:** 2026-09-18 · **Estado:** vigente

## El problema que lo origina

La app descarga mapas de OpenStreetMap para usarlos sin señal. **Eso está
expresamente prohibido por la política de uso de OpenStreetMap**, que lo nombra
como el caso prohibido:

> *"Offline use is not permitted on tile.openstreetmap.org. More specifically,
> features such as 'Download city/country for offline use' or 'Save area for
> later' rely on prefetch/bulk downloading and are therefore prohibited."*

> *"Prefetch/offline patterns place disproportionate load on community-funded
> servers and will be blocked without notice."*

Fuente: https://operations.osmfoundation.org/policies/tiles/

La función central de la app está construida sobre algo que puede ser cortado
sin aviso. **Esto se corrige antes de construir cualquier cosa nueva sobre
offline.**

## Decisión

**La app aloja sus propios mapas.** No consume servidores de terceros para uso
sin conexión.

### Mapa simple (sin vista satelital)

- Base: **Protomaps**, el mapa de OpenStreetMap empaquetado como archivo único.
  Gratis para uso no comercial, pensado para funcionar sin conexión.
- **SIEMPRE lleva curvas de nivel.** No es opcional ni configurable. Un mapa de
  montaña sin desnivel no sirve. Como Protomaps no las trae de fábrica, se
  calculan desde datos de elevación abiertos y se agregan como capa propia.
- **El mapa simple sin curvas de nivel no existe en esta app.**

### Mapa con vista satelital

- La imagen satelital de alta resolución donde se distinguen árboles y objetos
  puntuales **es paga en todos los proveedores**, salvo las fuentes públicas
  argentinas (ver abajo).
- Opción gratuita y mundial: **Sentinel-2** (10 metros por píxel). Se ven ríos,
  masas de bosque, claros y la forma del terreno. No se ven objetos puntuales.

### Fuentes públicas argentinas a aprovechar

- **IGN (Argenmap)**: mapa base oficial argentino, libre y gratuito, con curvas
  de nivel entre sus capas, descargable.
- **IDECOR (Córdoba) y CONAE**: imágenes de alta resolución (30–50 cm) de
  acceso libre y descargables.

**Pendiente de verificar:** si la cobertura de alta resolución de IDECOR llega a
las sierras o solo cubre localidades. Esto cambia mucho el resultado y hay que
confirmarlo antes de prometer nada.

## Alternativas descartadas

**Google Earth / Google Maps.** Sus términos prohíben copiar, redistribuir y
crear productos derivados, y prohíben expresamente usar la salida para *"create
or augment any other mapping-related dataset"*. Además la imagen no es de
Google: la licencian de terceros (Airbus, Maxar, CNES), así que ni siquiera
tienen derecho a cederla.

Fuente: https://www.google.com/help/terms_maps-earth/

**Armar un mapa propio con capturas de pantalla de Google Earth.** Descartado
por dos motivos independientes, cada uno suficiente:

1. **Legal:** es exactamente el caso prohibido citado arriba, y además la app
   tiene usuarios que no son el dueño, con lo cual hay redistribución a terceros.
2. **Técnico:** una captura de pantalla no tiene coordenadas, y Google Earth
   dibuja un globo en perspectiva, no un rectángulo plano. Encajarla en un mapa
   produce errores de decenas de metros. La alerta de desvío de esta app se
   dispara a 50 metros: el error de la técnica es del mismo orden que lo que la
   app tiene que medir. **No es un problema de prolijidad, es inservible.**

## Consecuencia de costo

Todo lo elegido es gratuito. El único costo es alojar los archivos de mapa.

**Pendiente:** dimensionar ese costo de almacenamiento antes de cerrar la
arquitectura offline (decisión 003).
