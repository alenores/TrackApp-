import type {
  BackgroundLayerSpecification,
  FilterSpecification,
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { ColoresDelMapa } from "@/components/mapa/colores";

/**
 * Lo que le falta al fondo genérico para servir en la sierra.
 *
 * **El fondo que trae Protomaps está pensado para una ciudad.** Dibuja un
 * sendero igual que un callejón de servicio: gris casi blanco, de medio píxel,
 * invisible sobre fondo claro. Los arroyos, lo mismo, y recién al acercarse
 * mucho. Se midió sobre el Champaquí el 2026-09-21: los datos están en el
 * archivo —cientos de senderos y de arroyos, las cumbres, los refugios— pero
 * el dibujo los esconde.
 *
 * Acá se toman las capas tal como vienen y se corrigen. **Si alguna capa no
 * está**, porque Protomaps la renombró, no se toca y el fondo se dibuja como
 * viene: peor, pero se dibuja. La prueba automática es la que avisa que el
 * ajuste dejó de aplicarse.
 */

/** Toda capa que dibuje algo del terreno. La única sin filtro es el fondo liso. */
export type CapaConFiltro = Exclude<LayerSpecification, BackgroundLayerSpecification>;

type ColorDeTexto = NonNullable<SymbolLayerSpecification["paint"]>["text-color"];

const CAPA_DE_CAMINOS = "roads";

/** Los ids con los que Protomaps nombra las capas que se corrigen. */
const PUNTOS = "pois";
const OTROS_CAMINOS = "roads_other";
const NOMBRES_DE_CAMINOS_MENORES = "roads_labels_minor";
const ARROYOS = "water_stream";
const RIOS = "water_river";
const NOMBRES_DE_AGUA = "water_waterway_label";

export const SENDEROS = "senderos";
export const NOMBRES_DE_SENDEROS = "senderos_nombres";

/** Desde qué acercamiento se dibujan los arroyos. Protomaps los dejaba en 14. */
export const ARROYOS_DESDE = 12;

/** Desde qué acercamiento se escribe el nombre de un sendero. */
export const NOMBRES_DE_SENDEROS_DESDE = 13;

/**
 * Lo que Protomaps trae en el archivo pero no dibuja, porque su lista de
 * puntos es de ciudad. Cada uno tiene su ícono propio en la hoja del mapa.
 */
export const PUNTOS_DE_MONTANA = [
  "alpine_hut",
  "wilderness_hut",
  "camp_site",
  "viewpoint",
  "cave_entrance",
] as const;

/** Va con los de agua, no con los naturales: comparte paleta con la canilla. */
export const MANANTIAL = "spring";

/**
 * Cuánto antes que lo que dice el dato se muestran los puntos de montaña.
 * Un refugio viene marcado para el 15 y en el 14 ya está en el archivo.
 */
const PUNTOS_DE_MONTANA_ANTES = 1;

const LETRA = ["Noto Sans Regular"];

/**
 * El mismo filtro, sin los senderos.
 *
 * Protomaps mete los senderos en la misma bolsa que «otros caminos». Para
 * dibujarlos aparte hay que sacarlos de esa bolsa, o quedarían dibujados dos
 * veces, una encima de la otra.
 */
function sinSenderos(filtro: unknown): unknown {
  if (!Array.isArray(filtro)) return filtro;
  if (filtro[0] === "in" && filtro[1] === "kind") {
    return filtro.filter((cada) => cada !== "path");
  }
  return filtro.map(sinSenderos);
}

/**
 * Suma nombres a toda lista que ya contenga al testigo, esté donde esté.
 *
 * Protomaps escribe sus listas de puntos como `["literal", [...]]`, adentro
 * del filtro y adentro de la regla de color del texto. Buscar por un nombre
 * que ya está en la lista es lo que hace que los nuevos caigan en la familia
 * correcta —los refugios junto a la cumbre, el manantial junto a la canilla—
 * sin conocer cómo está armada la expresión.
 */
function sumarALaListaQueTiene(expresion: unknown, testigo: string, nuevos: readonly string[]): unknown {
  if (!Array.isArray(expresion)) return expresion;
  if (expresion[0] === "literal" && Array.isArray(expresion[1]) && expresion[1].includes(testigo)) {
    return ["literal", [...expresion[1], ...nuevos]];
  }
  return expresion.map((parte) => sumarALaListaQueTiene(parte, testigo, nuevos));
}

/**
 * La condición de acercamiento de los puntos, adelantada para los de montaña.
 *
 * Protomaps escribe `zoom >= min_zoom + 0`. Se reemplaza el `+ 0` por una
 * resta que solo aplica a los de montaña; el resto queda igual que estaba.
 */
function adelantarPuntosDeMontana(filtro: unknown): unknown {
  if (!Array.isArray(filtro)) return filtro;
  const esLaCondicionDeZoom =
    filtro[0] === ">=" &&
    JSON.stringify(filtro[1]) === JSON.stringify(["zoom"]) &&
    Array.isArray(filtro[2]) &&
    filtro[2][0] === "+";
  if (esLaCondicionDeZoom) {
    return [
      ">=",
      ["zoom"],
      [
        "-",
        ["get", "min_zoom"],
        ["case", ["in", ["get", "kind"], ["literal", [...PUNTOS_DE_MONTANA, MANANTIAL]]], PUNTOS_DE_MONTANA_ANTES, 0],
      ],
    ];
  }
  return filtro.map(adelantarPuntosDeMontana);
}

function capaDeSenderos(fuente: string, colores: ColoresDelMapa): LineLayerSpecification {
  return {
    id: SENDEROS,
    type: "line",
    source: fuente,
    "source-layer": CAPA_DE_CAMINOS,
    filter: ["all", ["!has", "is_tunnel"], ["!has", "is_bridge"], ["==", "kind", "path"]],
    layout: { "line-join": "round" },
    paint: {
      "line-color": colores.sendero,
      "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.2, 14, 2, 16, 3.5],
      /* A rayas: es la marca de siempre de un sendero a pie en cualquier mapa. */
      "line-dasharray": [2, 1.5],
    },
  };
}

function capaDeNombresDeSenderos(
  fuente: string,
  colores: ColoresDelMapa,
): SymbolLayerSpecification {
  return {
    id: NOMBRES_DE_SENDEROS,
    type: "symbol",
    source: fuente,
    "source-layer": CAPA_DE_CAMINOS,
    minzoom: NOMBRES_DE_SENDEROS_DESDE,
    filter: ["all", ["==", "kind", "path"], ["has", "name"]],
    layout: {
      "symbol-placement": "line",
      "text-field": ["get", "name"],
      "text-font": LETRA,
      "text-size": 12,
    },
    paint: {
      "text-color": colores.sendero,
      "text-halo-color": colores.contorno,
      "text-halo-width": 1.5,
    },
  };
}

/**
 * Toma las capas del fondo tal como las arma Protomaps y devuelve las mismas,
 * corregidas para la sierra. El orden se respeta: lo nuevo va justo encima de
 * lo que reemplaza.
 */
export function ajustarParaLaMontana(
  capas: LayerSpecification[],
  fuente: string,
  colores: ColoresDelMapa,
): LayerSpecification[] {
  const resultado: LayerSpecification[] = [];

  for (const original of capas) {
    const capa = { ...original } as LayerSpecification;

    if (
      capa.type !== "background" &&
      (capa.id === OTROS_CAMINOS || capa.id === NOMBRES_DE_CAMINOS_MENORES)
    ) {
      capa.filter = sinSenderos(capa.filter) as FilterSpecification;
    }

    if (capa.id === PUNTOS && capa.type === "symbol") {
      const conMontana = sumarALaListaQueTiene(capa.filter, "peak", PUNTOS_DE_MONTANA);
      capa.filter = adelantarPuntosDeMontana(
        sumarALaListaQueTiene(conMontana, "drinking_water", [MANANTIAL]),
      ) as FilterSpecification;

      const color = capa.paint?.["text-color"];
      capa.paint = {
        ...capa.paint,
        "text-color": sumarALaListaQueTiene(
          sumarALaListaQueTiene(color, "peak", PUNTOS_DE_MONTANA),
          "drinking_water",
          [MANANTIAL],
        ) as ColorDeTexto,
      };

      /* Un paso más grande que el de ciudad: se lee al sol, sin tapar el mapa. */
      capa.layout = {
        ...capa.layout,
        "text-size": ["interpolate", ["linear"], ["zoom"], 13, 11, 15, 13, 17, 14, 19, 16],
      };
    }

    if (capa.id === ARROYOS && capa.type === "line") {
      capa.minzoom = ARROYOS_DESDE;
      capa.paint = {
        ...capa.paint,
        "line-color": colores.agua,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 14, 1.5, 17, 3],
      };
    }

    if (capa.id === RIOS && capa.type === "line") {
      capa.paint = { ...capa.paint, "line-color": colores.agua };
    }

    if (capa.id === NOMBRES_DE_AGUA && capa.type === "symbol") {
      capa.paint = {
        ...capa.paint,
        "text-color": colores.agua,
        "text-halo-color": colores.contorno,
        "text-halo-width": 1.5,
      };
    }

    resultado.push(capa);

    if (capa.id === OTROS_CAMINOS) resultado.push(capaDeSenderos(fuente, colores));
    if (capa.id === NOMBRES_DE_CAMINOS_MENORES) {
      resultado.push(capaDeNombresDeSenderos(fuente, colores));
    }
  }

  return resultado;
}
