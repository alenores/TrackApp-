# 013 — Curvas de nivel sobre los dos mapas

**Fecha:** 2026-09-18 · **Estado:** vigente

## El punto de partida

Las curvas de nivel **no son parte de la imagen del mapa.** Son líneas, un dato
aparte, igual que las anotaciones.

Por eso **se descargan una sola vez por sector, sin importar qué mapa eligió el
usuario**, y se dibujan encima de cualquiera de los dos fondos. El satelital
también tiene curvas: no hay que elegir entre ver el terreno real y ver el
desnivel.

---

## Cuándo se ven

| Mapa | Curvas |
|---|---|
| **Simple** | **Siempre visibles. No se pueden apagar.** |
| **Satelital** | Se prenden y apagan con un botón |

En el mapa simple no hay botón porque no hay caso: un mapa de montaña sin
desnivel no sirve, y un botón de más es una decisión de más en el cerro.

---

## Cómo se dibujan sobre la foto satelital

Sobre una foto, unas líneas sueltas se confunden con el terreno. Hacen falta las
dos cosas juntas:

### 1. La foto se apaga

Cuando las curvas están prendidas, **la imagen satelital baja su contraste** para
que las líneas se recorten contra ella.

**El velo sigue el modo, no es fijo:**

- **Modo sol:** velo claro. La foto se lava hacia el blanco y las líneas oscuras
  saltan. Es además lo que mejor se lee bajo el sol.
- **Modo noche:** velo oscuro.

No inventa una regla nueva: reutiliza la que ya rige toda la app.

### 2. Las líneas van en un color que no existe en el terreno

**Color elegido: magenta.**

El motivo: **no hay roca, pasto, agua ni tierra magenta.** Cualquier cosa magenta
en pantalla es, sin ambigüedad, un dibujo de la app y no parte de la foto.

**Descartados y por qué:**

- **Naranja** (la primera idea): en Córdoba el pastizal seco de otoño e invierno
  es exactamente naranja dorado. La curva se perdería justo en la temporada de
  más salidas.
- **Marrón**, que es el estándar cartográfico: el terreno es marrón.
- **Celeste**: se lee bien, pero se confunde con el agua, que es justamente algo
  que hay que poder distinguir.

### 3. Los números de altura llevan borde

Sin un contorno alrededor, el número cae sobre una zona clara de la foto y
desaparece.

---

## Dos perillas para el peso, si algún día hacen falta

1. **Cada cuántos metros va una curva.** Una cada 50 m pesa cinco veces menos que
   una cada 10 m. En sierra, cada 25 m alcanza para leer el relieve.
2. **Desde qué acercamiento aparecen.** Mirando una sierra entera son una maraña
   ilegible igual; pueden empezar a dibujarse recién al acercarse.

**No están activadas por ahora.** Se usan solo si la medición muestra que hacen
falta.

---

## Cómo se construyó (2026-09-21)

**Lo que baja no son las curvas: es el relieve.** Por cada sector baja, junto
con el mapa, la altura del terreno como imagen —una por pedazo, en un solo
acercamiento— y las curvas las calcula el celular en el momento de dibujar.
Pesa mucho menos que bajar las líneas hechas, y el mismo dato sirve mañana para
otras cosas.

- **De dónde sale el relieve:** de Mapterhorn, que empaqueta el relieve de
  Copernicus (treinta metros por punto, medido desde satélite) en un archivo
  único del mismo tipo que el mapa de Protomaps. Verificado sobre el Champaquí:
  da 2785 m donde el cartel dice 2790. La dirección es fija, no cambia por día.
- **Entra por el mismo puente que el mapa** (`api/relieve`), pide sesión igual, y
  se guarda en el mismo depósito con su propio nombre. Borrar un sector se lleva
  su relieve, salvo el que comparta con un vecino.
- **Se lee siempre de lo guardado**, con el mismo candado que el mapa. Donde no
  hay relieve guardado no hay curvas, y eso no es un error.
- **Medido:** un pedazo de relieve pesa 114 KB. Un sector de sierra de 6 × 6 km
  son dos o cuatro pedazos, menos de medio mega; uno grande de 30 × 20 km, unos
  16 pedazos, 1,8 MB. El aviso de peso antes de bajar ya lo cuenta.
- **Cada cuánto:** cada 50 m mirando de lejos (acercamiento 12), cada 25 m de
  ahí en adelante, con la gruesa y el número cada 100 m. De más lejos no se
  dibujan.
- **El sombreado del terreno se probó y se sacó:** no estaba en esta decisión y
  complicaba el caso del borde del sector. Si algún día se quiere, es una capa
  sobre el mismo relieve que ya baja.

## Pendiente de verificación

- **Los valores exactos** de opacidad del velo sobre la foto satelital y de
  grosor de línea. Van con la prueba al sol que ya está pendiente en
  `DISENO_EXTERIOR.md`. El satelital ya baja al celular (2026-09-23), con su
  relieve y el velo puesto (valores provisorios). **Todavía no hay botón para
  apagar las curvas sobre la foto**: se ven siempre.
