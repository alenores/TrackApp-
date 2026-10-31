import { layers, namedFlavor } from "@protomaps/basemaps";
import type {
  ExpressionSpecification,
  LayerSpecification,
  LineLayerSpecification,
  RasterLayerSpecification,
  StyleSpecification,
} from "maplibre-gl";
import { ajustarParaLaMontana, SENDEROS } from "@/components/mapa/ajustes-de-montana";
import { coloresDelMapa, type ColoresDelMapa } from "@/components/mapa/colores";
import { DIRECCION_DE_LA_FOTO, QUIEN_HIZO_LA_FOTO } from "@/lib/mapas/foto-satelital";
import {
  DIRECCION_DE_GOOGLE_GUARDADO,
  DIRECCION_DE_LA_FOTO_GUARDADA,
  DIRECCION_DE_LA_SOMBRA_GUARDADA,
  DIRECCION_DE_LAS_TESELAS,
} from "@/lib/mapas/protocolo";
import { ACERCAMIENTO_MAXIMO, ACERCAMIENTOS_DE_LA_SOMBRA } from "@/lib/mapas/teselas";
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

export type TipoDeFondo = "dibujo" | "satelital" | "google";

/** La consulta conserva el fondo elegido aunque Google todavía no responda. */
export function opcionesDelMapa({
  enVivo, consultaGoogle, fondosDescargados,
}: {
  enVivo: boolean;
  consultaGoogle: boolean;
  fondosDescargados: TipoDeFondo[];
}): TipoDeFondo[] {
  if (!enVivo) return fondosDescargados.filter((fondo) => fondo !== "google");
  if (!consultaGoogle) return ["dibujo", "satelital"];
  return ["google"];
}

/** El nombre con el que el mapa conoce a la foto satelital. */
export const FUENTE_SATELITAL = "satelital";
export const FUENTE_GOOGLE = "google";

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

/** El nombre con el que el mapa conoce al sombreado del terreno guardado. */
export const FUENTE_DE_LA_SOMBRA = "sombra";

/** La capa que dibuja el sombreado del terreno (decisión 079). */
export const SOMBRA_DEL_TERRENO = "sombra-del-terreno";

/** Las imágenes de Google que quedaron de mirar Consultas (decisión 080). */
export const FUENTE_GOOGLE_GUARDADO = "google-guardado";
export const FOTO_DE_GOOGLE_GUARDADA = "foto-de-google-guardada";

/**
 * Las letras y los íconos del mapa viajan **dentro de la app**.
 *
 * Si se pidieran a internet, un mapa sin señal quedaría sin un solo nombre
 * escrito. Viven en `public/`, así que entran en la precarga: se guardan al
 * instalar la app y se leen siempre del celular, también navegando.
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
      /*
        El sombreado: solo de lo guardado y solo fuera del mapa en vivo. Donde
        no se bajó, el pedazo viene vacío y no se sombrea nada.
      */
      ...(enVivo
        ? {}
        : {
            /*
              Google guardado: solo lo que quedó de mirar Consultas y mientras
              Google lo permita. Donde no hay, viene vacío y se ve el mapa bajado.
            */
            [FUENTE_GOOGLE_GUARDADO]: {
              type: "raster" as const,
              tiles: [DIRECCION_DE_GOOGLE_GUARDADO],
              tileSize: 256,
              maxzoom: 22,
              attribution: "Imagen de Google guardada",
            },
            [FUENTE_DE_LA_SOMBRA]: {
              type: "raster-dem" as const,
              tiles: [DIRECCION_DE_LA_SOMBRA_GUARDADA],
              tileSize: 512,
              encoding: "terrarium" as const,
              minzoom: ACERCAMIENTOS_DE_LA_SOMBRA[0],
              maxzoom: ACERCAMIENTOS_DE_LA_SOMBRA[ACERCAMIENTOS_DE_LA_SOMBRA.length - 1],
            },
          }),
    },
    layers: [],
  };
}

/** Arroyos sobre la foto: más gruesos que en el dibujo, para leerse en la imagen. */
const ANCHO_ARROYO: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 12, 2, 14, 3, 17, 4.5];

/** Ríos sobre la foto. */
const ANCHO_RIO: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 11, 2.2, 14, 3.5, 17, 6];

/** Huellas y calles chicas: en el dibujo son de medio píxel y sobre la foto no se ven. */
const ANCHO_HUELLA: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 13, 1.8, 15, 2.8, 17, 4.5];

/**
 * ¿Esta línea ayuda a ubicarse sobre la foto?
 *
 * Entran ríos, arroyos, senderos, huellas y calles. Quedan afuera el relleno
 * del terreno, el borde de las calles (se confunde con la foto) y lo que no
 * es un paso: vías, pistas y muelles.
 */
function esLineaParaLaFoto(capa: LayerSpecification): capa is LineLayerSpecification {
  if (capa.type !== "line" || !("source-layer" in capa)) return false;
  const fuente = capa["source-layer"];
  if (fuente !== "roads" && fuente !== "water") return false;
  const id = capa.id;
  return !id.includes("casing") && !id.includes("rail") && !id.includes("runway") && !id.includes("taxiway") && !id.includes("pier");
}

/**
 * Las mismas líneas del mapa simple, preparadas para ir encima de la foto.
 *
 * Ríos, arroyos y senderos conservan su color. Las huellas y las calles no:
 * en el dibujo son casi blancas de día y casi negras de noche, y sobre la
 * foto desaparecen. Van del color del texto, oscuras con sol y claras de noche.
 */
function lineasSobreLaFoto(capas: LayerSpecification[], colores: ColoresDelMapa): LayerSpecification[] {
  return capas.filter(esLineaParaLaFoto).map((capa) => {
    const copia = structuredClone(capa);
    if (copia["source-layer"] === "water") {
      copia.paint = {
        ...copia.paint,
        "line-width": copia.id === "water_river" ? ANCHO_RIO : ANCHO_ARROYO,
      };
      return copia;
    }
    if (copia.id === SENDEROS) return copia;
    const gruesa = copia.id.includes("highway") || copia.id.includes("major");
    copia.paint = {
      ...copia.paint,
      "line-color": colores.texto,
      ...(gruesa ? {} : { "line-width": ANCHO_HUELLA }),
    };
    return copia;
  });
}

/**
 * El terreno sombreado, como una maqueta (decisión 079).
 *
 * Va **encima de la foto o del relleno del dibujo y debajo de las líneas y los
 * nombres**: oscurece las laderas a la sombra sin tapar nada de lo que se lee.
 * Los colores salen de las variables, distintos con sol y de noche.
 */
function capaDeLaSombra(colores: ColoresDelMapa): LayerSpecification {
  return {
    id: SOMBRA_DEL_TERRENO,
    type: "hillshade",
    source: FUENTE_DE_LA_SOMBRA,
    paint: {
      "hillshade-shadow-color": colores.relieveSombra,
      "hillshade-accent-color": colores.relieveSombra,
      "hillshade-highlight-color": colores.relieveLuz,
      "hillshade-exaggeration": 0.5,
    },
  };
}

/**
 * La imagen de Google guardada, encima del terreno y del sombreado (la foto de
 * Google ya trae sus sombras) y debajo de lo que se lee. Lleva el mismo velo
 * que la foto propia, para que las curvas se recorten encima (decisión 080).
 */
function capaDeGoogleGuardado(velo: RasterLayerSpecification["paint"]): LayerSpecification {
  return { id: FOTO_DE_GOOGLE_GUARDADA, type: "raster", source: FUENTE_GOOGLE_GUARDADO, paint: velo };
}

/**
 * Mete el sombreado encima del terreno y debajo de lo que se lee.
 *
 * En el dibujo va justo después del agua: el terreno, los parques y el agua
 * quedan abajo; arroyos, senderos, caminos y nombres, arriba. Sobre la foto,
 * justo antes de la primera línea o nombre.
 */
function conSombraDebajoDeLasLineas(
  capas: LayerSpecification[],
  colores: ColoresDelMapa,
  velo: RasterLayerSpecification["paint"],
): LayerSpecification[] {
  const agua = capas.findIndex((capa) => capa.type === "fill" && capa.id === "water");
  const primeraEncima = capas.findIndex((capa) => capa.type === "line" || capa.type === "symbol");
  const corte = agua !== -1 ? agua + 1 : primeraEncima === -1 ? capas.length : primeraEncima;
  return [...capas.slice(0, corte), capaDeLaSombra(colores), capaDeGoogleGuardado(velo), ...capas.slice(corte)];
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
  /** Con curvas encima, la foto lleva velo para que se lean. */
  conVelo = true,
  /**
   * En la navegación, sobre la foto van ríos, arroyos, senderos y huellas.
   * Al marcar un rectángulo no: ahí se mira el terreno pelado.
   */
  conLineas = false,
  /**
   * El terreno sombreado. Solo cuando el mapa lee lo guardado: en vivo no
   * existe la fuente del sombreado.
   */
  conSombra = false,
): LayerSpecification[] {
  const colores = coloresDelMapa();
  const dibujo = ajustarParaLaMontana(
    layers(FUENTE_DEL_FONDO, namedFlavor(modo === "sol" ? "light" : "dark"), {
      lang: "es",
    }).filter((capa) => capa.type !== "background"),
    FUENTE_DEL_FONDO,
    colores,
  );

  /*
    El velo: la foto baja su contraste para que las curvas de nivel se
    recorten encima. Sigue al modo: se aclara con sol y se oscurece de
    noche (decisión 013). Los valores finos quedan para la prueba al sol.
  */
  const velo: RasterLayerSpecification["paint"] = !conVelo
    ? {}
    : modo === "sol"
      ? { "raster-brightness-min": 0.2, "raster-contrast": -0.15 }
      : { "raster-brightness-max": 0.75, "raster-contrast": -0.15 };

  if (tipo === "dibujo") return conSombra ? conSombraDebajoDeLasLineas(dibujo, colores, velo) : dibujo;
  if (tipo === "google") {
    return [{ id: "foto-google", type: "raster", source: FUENTE_GOOGLE }];
  }

  /*
    El relleno del terreno taparía la foto. Los nombres van siempre. Las
    líneas de agua y de paso solo al navegar (decisión 060).
  */
  const conFoto: LayerSpecification[] = [
    {
      id: "foto-del-terreno",
      type: "raster",
      source: FUENTE_SATELITAL,
      paint: velo,
    },
    ...(conLineas ? lineasSobreLaFoto(dibujo, colores) : []),
    ...dibujo.filter((capa) => capa.type === "symbol"),
  ];
  return conSombra ? conSombraDebajoDeLasLineas(conFoto, colores, velo) : conFoto;
}

/** Todas las capas de fondo posibles, para poder sacarlas al cambiar de tipo. */
export function todasLasCapasDelFondo(modo: Modo): LayerSpecification[] {
  return [
    ...capasDelFondo(modo, "dibujo"),
    ...capasDelFondo(modo, "satelital"),
    ...capasDelFondo(modo, "satelital", true, true),
    ...capasDelFondo(modo, "google"),
    capaDeLaSombra(coloresDelMapa()),
    capaDeGoogleGuardado({}),
  ];
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
