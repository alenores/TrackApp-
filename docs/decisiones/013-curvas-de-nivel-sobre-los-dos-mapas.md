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

## Pendiente de verificación

- **Cuánto pesan realmente las curvas de un sector de sierra.** No se pudo medir:
  la red del entorno de trabajo bloquea las fuentes de datos. Lo único afirmable
  con certeza es el orden de magnitud: la imagen satelital siempre va a ser lo
  pesado y las curvas van a ser ruido al lado.
- **Los valores exactos** de opacidad del velo y de grosor de línea. Van con la
  prueba al sol que ya está pendiente en `DISENO_EXTERIOR.md`.
