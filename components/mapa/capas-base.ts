import { layers, namedFlavor } from "@protomaps/basemaps";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { DIRECCION_DE_LAS_TESELAS } from "@/lib/mapas/protocolo";
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

export type TipoDeFondo = "sin-mapa" | "simple" | "satelital";

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
 * El estilo con el que arranca el mapa.
 *
 * Trae la fuente de los pedazos guardados pero **ninguna capa de fondo**: esas
 * se agregan después, según el modo sol o noche, y se cambian sin rearmar el
 * mapa entero. Sin capa de fondo el color lo pone el recuadro que contiene al
 * mapa, con las variables de siempre.
 */
export function iconosDelFondo(modo: Modo): string {
  return modo === "sol" ? ICONOS_DE_SOL : ICONOS_DE_NOCHE;
}

export function estiloDelMapa(modo: Modo): StyleSpecification {
  return {
    version: 8,
    glyphs: LETRAS,
    sprite: iconosDelFondo(modo),
    sources: {
      [FUENTE_DEL_FONDO]: {
        type: "vector",
        tiles: [DIRECCION_DE_LAS_TESELAS],
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
 * caminos y los nombres sí vienen todos.
 */
export function capasDelFondo(modo: Modo): LayerSpecification[] {
  return layers(FUENTE_DEL_FONDO, namedFlavor(modo === "sol" ? "light" : "dark"), {
    lang: "es",
  }).filter((capa) => capa.type !== "background");
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
