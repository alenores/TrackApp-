# 022 — Ponerse al día una vez por apertura, no en cada pantalla

**Fecha:** 2026-09-23 · **Estado:** vigente
**Afina la decisión 012** (la actualización sigue siendo automática y muda).

---

## El problema que lo origina

Ale notó que pasar de una pantalla a otra era lento, como si la app fuera a
buscar los datos cada vez, aunque ya estaban todos en el celular.

Tenía razón. Cada pantalla, al abrirse, hacía tres cosas por su cuenta:

1. Le preguntaba a la base si había novedades: cuatro consultas.
2. Repasaba **todas** las pantallas guardadas para el cerro (el inicio, cada
   zona y, de cada ruta, su ficha y su navegación) y volvía a bajar las que
   faltaran.
3. Repasaba contra la base qué mapas estaban bajados.

Nada de eso traía nada nuevo: el paquete ya estaba al día. Pero peleaba por la
conexión con el pedido de la pantalla que el usuario quería ver.

## Decisión

- **Con señal, la app se pone al día una sola vez por apertura.** La primera
  pantalla sale a la base; las demás reciben lo que ya se sabe.
- **Si no hubo señal o falló, la próxima pantalla vuelve a intentar.** El que
  abrió la app en el pueblo sin señal y después la agarra se pone al día solo.
- **Después de guardar algo** (una ruta, una zona, un sector, una anotación, o
  al borrar alguno) se vuelve a preguntar enseguida, para que lo recién creado
  aparezca sin cerrar la app. Antes eso funcionaba de casualidad, porque la
  pantalla siguiente consultaba igual.
- Dejar listas las pantallas para el cerro y repasar los mapas bajados van
  detrás de una puesta al día buena, no detrás de cada pantalla.

Sigue siendo **automática y muda**, y sigue sin correr nunca durante una
navegación.

## Dónde vive

`lib/offline/puesta-al-dia.ts`, con su prueba. Las pantallas no la llaman
directamente: la usan a través de `useDatosDeLaApp`.

**La navegación no usa `useDatosDeLaApp`.** Lee lo guardado con
`usePaqueteGuardado`, que nunca se pone al día. Y la puesta al día se niega a
correr si la navegación está abierta, por si alguien lo olvida. Hasta el
2026-09-24 esto estaba escrito pero no se cumplía: al reabrir la app parada en
la navegación, la puesta al día arrancaba desde ahí.

## Lo que queda abierto

- **Botón de «sincronizar a mano»: no, por ahora** (decidió Ale el 2026-09-24).
- **Una app que queda abierta días enteros** no se vuelve a poner al día hasta
  que se reabre. Si hace falta, se agrega una puesta al día al volver a la app
  después de varias horas. Lo decide Ale.
- ~~La otra mitad de la lentitud~~ **Resuelto el 2026-09-24:** las pantallas de
  entrada (inicio, listas y zonas) esperaban hasta tres segundos al servidor en
  cada toque. Ahora, como la ficha y la navegación, abren desde lo guardado y
  traen la versión nueva por detrás: se ve en la próxima apertura. Todas las
  pantallas andan igual.
