import type { LineString, Point, Position } from "geojson";
import { TRAZO } from "@/lib/anotaciones/colores-de-trazo";
import type { IconoPunto } from "@/types/database";

/**
 * Lo que sirve para convertir en marcas lo que viene de afuera.
 *
 * - **Traer de afuera** (un archivo de Google Earth o de un GPS) adivina el
 *   ícono de cada punto por el nombre: «Refugio Los Tabaquillos» → refugio.
 * - **OpenStreetMap** trae las tranqueras y los alambrados, que el mapa de
 *   fondo no tiene porque Protomaps los descarta. Una tranquera es un punto; un
 *   alambrado, un trazo color «Límite». Se traen solos al crear una zona
 *   (decisión 052).
 * - **La firma** de una geometría dice si algo ya está, para no repetirlo.
 *
 * Todo esto es cuenta pura, sin navegador ni base, para poder probarla.
 */

export type AnotacionParaImportar = {
  tipo: "punto" | "trazo";
  icono: IconoPunto | null;
  color: string | null;
  comentario: string | null;
  geometria: Point | LineString;
};

const ICONO_SI_NO_SE_SABE: IconoPunto = "cruce";

/** Para adivinar el ícono por el nombre: qué palabras nombran cada cosa. */
const PALABRAS_DE_CADA_ICONO: Record<IconoPunto, string[]> = {
  refugio: ["refugio", "puesto", "rancho", "casa"],
  arroyo: ["arroyo", "rio", "río", "vado"],
  cumbre: ["cumbre", "cerro", "cima", "pico"],
  puente: ["puente", "pasarela"],
  pueblo: ["pueblo", "paraje", "villa"],
  cartel: ["cartel", "señal", "senal", "letrero"],
  fuente: ["fuente", "manantial", "vertiente", "ojo de agua", "agua"],
  iglesia: ["iglesia", "capilla", "ermita", "gruta"],
  cruce: ["cruce", "bifurcaci", "desvio", "desvío", "empalme"],
  mirador: ["mirador", "vista", "balcon", "balcón"],
  cascada: ["cascada", "salto", "chorro"],
  tranquera: ["tranquera", "porton", "portón", "puerta"],
  estacionamiento: ["estacionamiento", "parking", "aparcamiento"],
  sitio: ["sitio", "sitios"],
};

export function iconoPorElNombre(nombre: string | null | undefined): IconoPunto {
  const bajo = (nombre ?? "").toLowerCase();
  for (const [icono, palabras] of Object.entries(PALABRAS_DE_CADA_ICONO)) {
    if (palabras.some((palabra) => bajo.includes(palabra))) return icono as IconoPunto;
  }
  return ICONO_SI_NO_SE_SABE;
}

/** Firma de una geometría, para saber si ya está. Redondeada a ~1 m. */
export function firma(geometria: Point | LineString): string {
  const redondear = ([lon, lat]: Position) => `${lon.toFixed(5)},${lat.toFixed(5)}`;
  return geometria.type === "Point"
    ? `P:${redondear(geometria.coordinates)}`
    : `L:${geometria.coordinates.map(redondear).join(";")}`;
}

/** Lo que contesta OpenStreetMap a la pregunta por tranqueras y alambrados. */
export type RespuestaDeOsm = {
  elements: Array<{
    type: "node" | "way";
    lat?: number;
    lon?: number;
    geometry?: Array<{ lat: number; lon: number }>;
    tags?: Record<string, string>;
  }>;
};

const ALAMBRADO = TRAZO.limite.color;

/**
 * Las tranqueras y alambrados que contestó OpenStreetMap, como marcas a
 * guardar. Lo que no es ni tranquera ni alambrado vuelve como `null`, para
 * poder contarlo.
 */
export function candidatasDeOsm(respuesta: RespuestaDeOsm): Array<AnotacionParaImportar | null> {
  return respuesta.elements.map((elemento): AnotacionParaImportar | null => {
    const barrera = elemento.tags?.barrier;
    const nombre = elemento.tags?.name;

    if (elemento.type === "node" && barrera === "gate" && elemento.lat != null && elemento.lon != null) {
      return {
        tipo: "punto",
        icono: "tranquera",
        color: null,
        comentario: nombre ? `Tranquera: ${nombre}` : "Tranquera",
        geometria: { type: "Point", coordinates: [elemento.lon, elemento.lat] },
      };
    }

    if (elemento.type === "way" && barrera === "fence" && elemento.geometry && elemento.geometry.length >= 2) {
      return {
        tipo: "trazo",
        icono: null,
        color: ALAMBRADO,
        comentario: nombre ? `Alambrado: ${nombre}` : "Alambrado",
        geometria: {
          type: "LineString",
          coordinates: elemento.geometry.map(({ lon, lat }) => [lon, lat]),
        },
      };
    }

    return null;
  });
}
