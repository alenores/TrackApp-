# 015 — Los dos modos de color, y la prueba que los sostiene

> Decidido: 2026-09-19 · Pedido por Ale

## El pedido

«¿Contemplaste el modo claro y oscuro, verdad? No quiero que me lo muestres,
pero sí que lo contemples y que estén las dos opciones siempre disponibles.»

## Lo que había

Nada. Las reglas del proyecto pedían dos modos desde el primer día, pero en el
código había **un solo juego de colores y ningún botón**.

Y lo que lo impedía no era el botón. Eran **34 pantallas que escribían los
colores a mano**. Con un color fijo en un lado del par fondo/texto, dar vuelta
el fondo deja letra clara sobre fondo claro: la pantalla queda ilegible justo
en el modo que se prendió para poder leerla.

## La decisión

**Ninguna pantalla escribe un color. Todos salen de las variables.** Las dos
listas de variables tienen exactamente los mismos nombres, línea por línea.

El cambio es **manual**, con un botón, y el botón está en el encabezado y
también abajo en la pantalla de navegación, al alcance del pulgar. El automático
del sistema va por horario, no por si está pegando el sol: a las cinco de la
tarde en el cerro puede estar reventando y el sistema ya se puso en oscuro.

Arranca en modo noche, que es como se veía la app hasta ahora, y se acuerda de
lo que se eligió.

## La prueba, que es la parte que importa

Que a un modo le falte un color **no se nota leyendo el código ni abriendo la
app en casa**: se nota en el cerro, cuando ya no se puede leer la pantalla. Por
eso lo verifica la máquina, en cada cambio:

1. Que los dos modos definan exactamente los mismos colores.
2. Que ninguno quede vacío.
3. Que los colores de aviso se escriban sin transparencia, para poder medirlos.
4. Que **cada combinación de texto y fondo** llegue al mínimo de contraste que
   pide `AGENTS.md` — 7:1 para texto normal, 4.5:1 para íconos y bordes de lo
   que se toca — **en los dos modos**.

Esa prueba encontró tres colores que no llegaban, el verde del botón principal
entre ellos.

## Dos bordes, no uno

Se separó la rayita que divide dos superficies (decorativa, puede ser tenue) del
contorno de algo que se toca —un campo, un botón, el foco— que sí tiene que
verse con sol de frente y sí se mide contra el mínimo.

## Lo que quedó afuera a propósito

- **El logo** mantiene sus colores fijos en los dos modos. Una marca no se
  invierte.
- **El color de fondo del arranque de la app instalada** lo fija el sistema
  operativo al instalar y no puede cambiar con el modo.

## Auditoría de fuentes

**Leído en tiempo real:**
- `app/globals.css`, `lib/modo.ts`, `lib/modo.test.ts`, `hooks/use-modo.ts`,
  `components/ui/boton-de-modo.tsx`, `components/ui/card.tsx`,
  `components/ui/button.tsx`, `components/mapa/mapa.tsx`,
  `lib/pwa/inline-splash.ts`, `app/layout.tsx`.

**Inferido (no verificado):** nada.

**Pendiente de verificación:**
- Cómo se ve el modo sol **con sol de verdad, en el cerro**. Los contrastes
  cumplen los mínimos medidos, pero eso lo confirma el ojo de Ale afuera, no una
  prueba.
