import { layers, namedFlavor } from "@protomaps/basemaps";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { ajustarParaLaMontana } from "@/components/mapa/ajustes-de-montana";
import { coloresDelMapa } from "@/components/mapa/colores";
import { DIRECCION_DE_LA_FOTO, QUIEN_HIZO_LA_FOTO } from "@/lib/mapas/foto-satelital";
import {
  DIRECCION_DE_LA_FOTO_GUARDADA,
  DIRECCION_DE_LAS_TESELAS,
} from "@/lib/mapas/protocolo";
import { ACERCAMIENTO_MAXIMO } from "@/lib/mapas/teselas";
import type { Modo } from "@/lib/modo";

/**
 * De dónde sale el fondo del mapa y cómo se dibuja.
 *
 * **Este es el único lugar de la app que sabe de dónde sale un mapa.** Ninguna
 * pantalla se entera: piden el fondo y dibujan lo que venga.
 *
 * El fondo se lee **siempre de lo guardado en el celular**, nunca de internet.
 * Un sector que el usuario bajó se dibuja; uno que no bajó no dibuja nada y se
 * ve el fondo liso de la app. **Eso no es una falla, es un modo legítimo**: la
 * línea de la ruta y el punto del GPS se ven igual, y el aviso de desvío no
 * mira el mapa.
 *
 * **Prohibido poner acá los mapas de OpenStreetMap servidos por su comunidad.**
 * Su política prohíbe expresamente bajarlos por adelantado para usarlos sin
 * señal, que es justo lo que hace esta app. Ver
 * docs/decisiones/007-de-donde-salen-los-mapas.md
 */

export type TipoDeFondo = "dibujo" | "satelital";

/** El nombre con el que el mapa conoce a la foto satelital. */
export const FUENTE_SATELITAL = "satelital";

/**
 * La foto del terreno, en vivo: solo en las pantallas de administrar.
 *
 * La misma foto que baja al celular con el mapa satelital. De dónde sale lo
 * sabe un solo archivo.
 */
const FOTO_DEL_TERRENO = DIRECCION_DE_LA_FOTO;

export { QUIEN_HIZO_LA_FOTO };

/** El nombre con el que el mapa conoce a los pedazos guardados. */
export const FUENTE_DEL_FONDO = "fondo";

/**
 * Las letras y los íconos del mapa viajan **dentro de la app**.
 *
 * Si se pidieran a internet, un mapa sin señal quedaría sin un solo nombre
 * escrito. Al estar acá, entran en el paquete que el celular guarda solo.
 */
const LETRAS = "/fuentes-del-mapa/{fontstack}/{range}.pbf";
const ICONOS_DE_SOL = "/iconos-del-mapa/light";
const ICONOS_DE_NOCHE = "/iconos-del-mapa/dark";

/**
 * La dirección completa de un archivo de la app.
 *
 * **El motor del mapa no acepta atajos.** Un camino que arranca con barra —el
 * que usa todo el resto de la app— lo rechaza de plano, y ahí el mapa no se
 * arma: no se dibuja ni el fondo ni la ruta ni el punto del GPS. Hay que
 * pasarle la dirección entera, con el nombre del sitio adelante.
 *
 * Se arma en el momento y no se escribe fija, porque el sitio cambia según
 * dónde esté corriendo la app: en el celular, en la computadora del que la
 * programa, o en una dirección de prueba.
 */
function direccionCompleta(camino: string): string {
  if (typeof window === "undefined") return camino;
  return `${window.location.origin}${camino}`;
}

/**
 * El estilo con el que arranca el mapa.
 *
 * Trae la fuente de los pedazos guardados pero **ninguna capa de fondo**: esas
 * se agregan después, según el modo sol o noche, y se cambian sin rearmar el
 * mapa entero. Sin capa de fondo el color lo pone el recuadro que contiene al
 * mapa, con las variables de siempre.
 */
export function iconosDelFondo(modo: Modo): string {
  return direccionCompleta(modo === "sol" ? ICONOS_DE_SOL : ICONOS_DE_NOCHE);
}

/**
 * Dónde pedir los pedazos cuando el mapa se mira **en vivo**.
 *
 * **Es la única excepción a «las pantallas leen de lo guardado».** Al definir el
 * rectángulo de una zona o de un sector, el usuario está en su casa, con señal,
 * pegando direcciones de Google Maps. Sin un mapa abajo no puede ver si el
 * rectángulo cae donde quiere, y un rectángulo flotando en gris no le dice
 * nada. Nada de esto pasa navegando: navegar sigue leyendo solo lo guardado.
 *
 * Ver `docs/decisiones/018-el-mapa-en-vivo-al-definir-un-rectangulo.md`
 */
const EN_VIVO = "/api/mapa/{z}/{x}/{y}";

export function estiloDelMapa(modo: Modo, enVivo = false): StyleSpecification {
  return {
    version: 8,
    glyphs: direccionCompleta(LETRAS),
    sprite: iconosDelFondo(modo),
    sources: {
      /*
        La foto: en vivo, de internet; si no, del celular y de ningún otro lado.
        Donde no se bajó el satelital la foto viene vacía y se ve el fondo liso.
      */
      [FUENTE_SATELITAL]: {
        type: "raster" as const,
        tiles: [enVivo ? FOTO_DEL_TERRENO : DIRECCION_DE_LA_FOTO_GUARDADA],
        tileSize: 256,
        maxzoom: enVivo ? 17 : ACERCAMIENTO_MAXIMO,
        attribution: QUIEN_HIZO_LA_FOTO,
      },
      [FUENTE_DEL_FONDO]: {
        type: "vector",
        tiles: [enVivo ? direccionCompleta(EN_VIVO) : DIRECCION_DE_LAS_TESELAS],
        minzoom: 0,
        /**
         * Pasado este acercamiento no se pide nada nuevo: se agranda el último
         * pedazo que hay. Sin esto, acercarse de más deja la pantalla en blanco.
         */
        maxzoom: ACERCAMIENTO_MAXIMO,
      },
    },
    layers: [],
  };
}

/**
 * Las capas que dibujan el mapa, para un modo de color.
 *
 * **Sin la capa de fondo liso** que trae el juego original: ese color taparía
 * el del recuadro y quedaría fijo en los dos modos. La tierra, el agua, los
 * caminos y los nombres sí vienen todos, **corregidos para la sierra**: el
 * juego original es de ciudad y esconde senderos y arroyos.
 */
export function capasDelFondo(
  modo: Modo,
  tipo: TipoDeFondo = "dibujo",
): LayerSpecification[] {
  const dibujo = ajustarParaLaMontana(
    layers(FUENTE_DEL_FONDO, namedFlavor(modo === "sol" ? "light" : "dark"), {
      lang: "es",
    }).filter((capa) => capa.type !== "background"),
    FUENTE_DEL_FONDO,
    coloresDelMapa(),
  );

  if (tipo === "dibujo") return dibujo;

  /*
    Sobre la foto van solo los nombres. Los caminos y el relleno del dibujo
    taparían el terreno, que es justo lo que se quiere mirar; los nombres, en
    cambio, son lo que permite reconocer dónde está uno.
  */
  return [
    {
      id: "foto-del-terreno",
      type: "raster",
      source: FUENTE_SATELITAL,
      /*
        El velo: la foto baja su contraste para que las curvas de nivel se
        recorten encima. Sigue al modo: se aclara con sol y se oscurece de
        noche (decisión 013). Los valores finos quedan para la prueba al sol.
      */
      paint:
        modo === "sol"
          ? { "raster-brightness-min": 0.2, "raster-contrast": -0.15 }
          : { "raster-brightness-max": 0.75, "raster-contrast": -0.15 },
    },
    ...dibujo.filter((capa) => capa.type === "symbol"),
  ];
}

/** Todas las capas de fondo posibles, para poder sacarlas al cambiar de tipo. */
export function todasLasCapasDelFondo(modo: Modo): LayerSpecification[] {
  return [...capasDelFondo(modo, "dibujo"), ...capasDelFondo(modo, "satelital")];
}

/**
 * ¿Ya se pueden descargar mapas?
 *
 * Se responde desde el mismo lugar que arma el fondo, así las pantallas no
 * tienen que saber nada de esto.
 */
export function sePuedenDescargarMapas(): boolean {
  return true;
}
