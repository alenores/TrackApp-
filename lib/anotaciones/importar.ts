import type { Feature, FeatureCollection, LineString, Point, Position } from "geojson";
import { COLORES_DE_TRAZO, TRAZO, type ColorDeTrazo } from "@/lib/anotaciones/colores-de-trazo";
import type { Anotacion, IconoPunto, Rectangulo } from "@/types/database";

/**
 * Traer anotaciones de afuera a un sector.
 *
 * Dos orígenes, una sola cosa: lo que hay dibujado en otro lado se convierte
 * en puntos y trazos del sector, igual que si se hubieran marcado a mano.
 *
 * - **Google Earth.** Ale marca puntos y líneas en la computadora, sobre la
 *   foto, y exporta el archivo. Cada marcador es un punto; cada línea, un trazo.
 *   El ícono se adivina por el nombre («Refugio Los Tabaquillos» → refugio) y
 *   el color del trazo se toma del que traiga la línea, al más parecido de
 *   los cuatro nuestros.
 * - **OpenStreetMap.** Las tranqueras y los alambrados, que el mapa de fondo
 *   no trae porque Protomaps los descarta. Una tranquera es un punto; un
 *   alambrado, un trazo color «Límite».
 *
 * **Solo entra lo que cae adentro del sector.** Lo de afuera se cuenta y se
 * dice, no se agrega: una anotación pertenece a un sector. **Y lo que ya está
 * no se repite:** traer dos veces lo mismo no duplica nada.
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

export type Importacion = {
  /** Las que se van a agregar. */
  dentro: AnotacionParaImportar[];
  /** Cuántas cayeron fuera del sector. */
  fuera: number;
  /** Cuántas ya estaban en el sector, iguales. */
  repetidas: number;
  /** Cuántas no eran ni un punto ni una línea (un área, por ejemplo). */
  ignoradas: number;
};

const ICONO_SI_NO_SE_SABE: IconoPunto = "cruce";
const COLOR_SI_NO_SE_SABE: ColorDeTrazo = "huella";

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
};

export function iconoPorElNombre(nombre: string | null | undefined): IconoPunto {
  const bajo = (nombre ?? "").toLowerCase();
  for (const [icono, palabras] of Object.entries(PALABRAS_DE_CADA_ICONO)) {
    if (palabras.some((palabra) => bajo.includes(palabra))) return icono as IconoPunto;
  }
  return ICONO_SI_NO_SE_SABE;
}

function canal(color: string, desde: number): number {
  return parseInt(color.slice(desde, desde + 2), 16);
}

/** El color de trazo nuestro más parecido a uno que venga de afuera. */
export function colorDeTrazoMasParecido(color: string | null | undefined): ColorDeTrazo {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return COLOR_SI_NO_SE_SABE;
  let mejor: ColorDeTrazo = COLOR_SI_NO_SE_SABE;
  let distancia = Number.POSITIVE_INFINITY;
  for (const clave of COLORES_DE_TRAZO) {
    const nuestro = TRAZO[clave].color;
    const d = Math.hypot(
      canal(color, 1) - canal(nuestro, 1),
      canal(color, 3) - canal(nuestro, 3),
      canal(color, 5) - canal(nuestro, 5),
    );
    if (d < distancia) {
      distancia = d;
      mejor = clave;
    }
  }
  return mejor;
}

function cae(posicion: Position, rectangulo: Rectangulo): boolean {
  const [lon, lat] = posicion;
  return (
    lat <= rectangulo.latNorte &&
    lat >= rectangulo.latSur &&
    lon >= rectangulo.lonOeste &&
    lon <= rectangulo.lonEste
  );
}

/** Un punto cae si está adentro; una línea, si alguno de sus puntos lo está. */
function caeEnElSector(geometria: Point | LineString, rectangulo: Rectangulo): boolean {
  return geometria.type === "Point"
    ? cae(geometria.coordinates, rectangulo)
    : geometria.coordinates.some((posicion) => cae(posicion, rectangulo));
}

function comentarioDe(nombre: unknown, descripcion: unknown): string | null {
  const partes = [nombre, descripcion]
    .map((parte) => (typeof parte === "string" ? parte.trim() : ""))
    .filter(Boolean);
  return partes.length ? partes.join(". ") : null;
}

/** Firma de una geometría, para saber si ya está. Redondeada a ~1 m. */
function firma(geometria: Point | LineString): string {
  const redondear = ([lon, lat]: Position) => `${lon.toFixed(5)},${lat.toFixed(5)}`;
  return geometria.type === "Point"
    ? `P:${redondear(geometria.coordinates)}`
    : `L:${geometria.coordinates.map(redondear).join(";")}`;
}

/**
 * Filtra lo que se va a agregar: adentro del sector y no repetido.
 */
function seleccionar(
  candidatas: Array<AnotacionParaImportar | null>,
  rectangulo: Rectangulo,
  yaEstan: Anotacion[],
): Importacion {
  const conocidas = new Set(yaEstan.map((cada) => firma(cada.geometria)));
  const resultado: Importacion = { dentro: [], fuera: 0, repetidas: 0, ignoradas: 0 };

  for (const candidata of candidatas) {
    if (!candidata) {
      resultado.ignoradas += 1;
      continue;
    }
    if (!caeEnElSector(candidata.geometria, rectangulo)) {
      resultado.fuera += 1;
      continue;
    }
    const suFirma = firma(candidata.geometria);
    if (conocidas.has(suFirma)) {
      resultado.repetidas += 1;
      continue;
    }
    conocidas.add(suFirma);
    resultado.dentro.push(candidata);
  }

  return resultado;
}

/** Deja solo longitud y latitud: Google Earth agrega la altura como tercer número. */
function planas(coordenadas: Position[]): Position[] {
  return coordenadas.map(([lon, lat]) => [lon, lat]);
}

function deUnaFigura(figura: Feature): Array<AnotacionParaImportar | null> {
  const propiedades = figura.properties ?? {};
  const nombre = propiedades.name;
  const comentario = comentarioDe(nombre, propiedades.description);
  const geometria = figura.geometry;

  if (!geometria) return [null];

  if (geometria.type === "Point") {
    return [
      {
        tipo: "punto",
        icono: iconoPorElNombre(typeof nombre === "string" ? nombre : null),
        color: null,
        comentario,
        geometria: { type: "Point", coordinates: planas([geometria.coordinates])[0] },
      },
    ];
  }

  const color = TRAZO[colorDeTrazoMasParecido(propiedades.stroke)].color;
  const trazo = (coordenadas: Position[]): AnotacionParaImportar | null =>
    coordenadas.length < 2
      ? null
      : {
          tipo: "trazo",
          icono: null,
          color,
          comentario,
          geometria: { type: "LineString", coordinates: planas(coordenadas) },
        };

  if (geometria.type === "LineString") return [trazo(geometria.coordinates)];
  if (geometria.type === "MultiLineString") return geometria.coordinates.map(trazo);
  if (geometria.type === "MultiPoint") {
    return geometria.coordinates.map((posicion) => ({
      tipo: "punto" as const,
      icono: iconoPorElNombre(typeof nombre === "string" ? nombre : null),
      color: null,
      comentario,
      geometria: { type: "Point" as const, coordinates: planas([posicion])[0] },
    }));
  }
  return [null];
}

/** Lo que trae un archivo de Google Earth, ya leído como figuras. */
export function anotacionesDeGoogleEarth(
  figuras: FeatureCollection,
  rectangulo: Rectangulo,
  yaEstan: Anotacion[],
): Importacion {
  return seleccionar(figuras.features.flatMap(deUnaFigura), rectangulo, yaEstan);
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

export function anotacionesDeOsm(
  respuesta: RespuestaDeOsm,
  rectangulo: Rectangulo,
  yaEstan: Anotacion[],
): Importacion {
  const candidatas = respuesta.elements.map((elemento): AnotacionParaImportar | null => {
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

  return seleccionar(candidatas, rectangulo, yaEstan);
}

/** Cómo se cuenta lo que se va a agregar, para la pantalla. */
export function resumenDeImportacion(importacion: Importacion): string {
  const puntos = importacion.dentro.filter((cada) => cada.tipo === "punto").length;
  const trazos = importacion.dentro.length - puntos;
  const partes: string[] = [];
  if (puntos) partes.push(`${puntos} ${puntos === 1 ? "punto" : "puntos"}`);
  if (trazos) partes.push(`${trazos} ${trazos === 1 ? "trazo" : "trazos"}`);
  const queEntra = partes.length ? `Se van a agregar ${partes.join(" y ")}.` : "No hay nada nuevo para agregar.";

  const avisos: string[] = [];
  if (importacion.fuera) {
    avisos.push(
      `${importacion.fuera} ${importacion.fuera === 1 ? "cae" : "caen"} fuera del sector y no ${importacion.fuera === 1 ? "entra" : "entran"}.`,
    );
  }
  if (importacion.repetidas) {
    avisos.push(`${importacion.repetidas} ya ${importacion.repetidas === 1 ? "estaba" : "estaban"} y no se ${importacion.repetidas === 1 ? "repite" : "repiten"}.`);
  }
  if (importacion.ignoradas) {
    avisos.push(`${importacion.ignoradas} no ${importacion.ignoradas === 1 ? "es" : "son"} ni punto ni línea y se ${importacion.ignoradas === 1 ? "saltea" : "saltean"}.`);
  }
  return [queEntra, ...avisos].join(" ");
}
