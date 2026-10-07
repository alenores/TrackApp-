import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { gpx } from "@tmcw/togeojson";
import { leerArchivoDeGoogleEarth } from "@/lib/anotaciones/archivo-de-google-earth";
import { esCoordenadaValida, largoDeLinea } from "@/lib/caminos/geometria";

/**
 * Leer un archivo de Google Earth o de un GPS y separar lo que trae.
 *
 * Devuelve **cada línea por su lado, cada punto por su lado y cada cosa que no
 * se pudo usar con el motivo**. Nunca junta líneas: un proyecto de Earth con
 * siete alternativas son siete líneas, no un camino de setenta kilómetros. Si
 * un marcador trae varias líneas juntas (una `MultiGeometry` de Earth o un
 * GPX con varios segmentos), cada una sale aparte con los datos de su marcador.
 *
 * **El lector no decide qué es cada línea.** Si va a ser un Camino o un trazo
 * lo elige la persona, línea por línea, al importar. El color del archivo se
 * conserva solo para mostrarlo en la vista previa.
 *
 * El `.kml` y el `.kmz` se abren con el lector de Google Earth de las
 * anotaciones, el mismo de siempre. El `.gpx` se abre acá porque el lector de
 * rutas rechaza un GPX que trae solo puntos, y acá un archivo de puntos sirve.
 *
 * Nunca lanza: si algo no cierra, dice qué pasó y qué hacer.
 */

export const FORMATOS_DE_CAMINOS = ".kml,.kmz,.gpx";

export type FormatoDeCaminos = "kml" | "kmz" | "gpx";

type DatosDeOrigen = {
  /**
   * El lugar en el archivo, contando líneas, puntos y omitidos juntos. Sirve
   * para mostrar todo en el mismo orden en que lo dibujó la persona.
   */
  orden: number;
  /**
   * De qué marcador del archivo salió, empezando por 0. Varias líneas o puntos
   * con el mismo número salieron del mismo marcador.
   */
  elemento: number;
  /** El nombre tal cual viene en el archivo; vacío si no trae. */
  nombre: string | null;
  /** El nombre para ofrecer en la vista previa cuando el archivo no lo trae o lo repite. */
  nombreSugerido: string;
  descripcion: string | null;
  /** Google Earth manda algunas descripciones como HTML: no se dibujan tal cual. */
  descripcionEsHtml: boolean;
  /** El color con que se veía en el archivo, como `#rrggbb`. Solo para la vista previa. */
  color: string | null;
};

export type LineaLeida = DatosDeOrigen & {
  /** Los puntos tal cual vienen: `[longitud, latitud]` o con la altura como tercer número. */
  coordenadas: Position[];
  largoM: number;
  /** Las líneas que se dibujan en Earth no traen altura: van todas en cero. */
  tieneAlturas: boolean;
};

export type PuntoLeido = DatosDeOrigen & {
  coordenada: Position;
};

export type ElementoOmitido = {
  orden: number;
  elemento: number;
  nombre: string | null;
  motivo: string;
};

export type LecturaDeCaminos =
  | {
      ok: true;
      formato: FormatoDeCaminos;
      lineas: LineaLeida[];
      puntos: PuntoLeido[];
      omitidos: ElementoOmitido[];
    }
  | { ok: false; error: string };

export type SeparacionDeFiguras = {
  lineas: LineaLeida[];
  puntos: PuntoLeido[];
  omitidos: ElementoOmitido[];
};

const DANADO =
  "El archivo está dañado y no se puede leer. Probá exportarlo de nuevo desde donde lo sacaste.";

function reconocerFormato(nombre: string): FormatoDeCaminos | null {
  const bajo = nombre.toLowerCase();
  if (bajo.endsWith(".kml")) return "kml";
  if (bajo.endsWith(".kmz")) return "kmz";
  if (bajo.endsWith(".gpx")) return "gpx";
  return null;
}

async function figurasDelGpx(archivo: File): Promise<{ ok: true; figuras: FeatureCollection } | { ok: false; error: string }> {
  let texto: string;
  try {
    texto = await archivo.text();
  } catch {
    return { ok: false, error: "No se pudo leer el archivo. Probá elegirlo de nuevo." };
  }
  if (!texto.trim()) return { ok: false, error: "El archivo está vacío." };

  let documento: Document;
  try {
    documento = new DOMParser().parseFromString(texto, "application/xml");
  } catch {
    return { ok: false, error: DANADO };
  }
  if (documento.querySelector("parsererror")) return { ok: false, error: DANADO };

  try {
    return { ok: true, figuras: gpx(documento) as FeatureCollection };
  } catch {
    return {
      ok: false,
      error: "El archivo no tiene el formato de un GPX. Fijate que sea el que bajaste del reloj o de la aplicación del GPS.",
    };
  }
}

export async function leerArchivoDeCaminos(archivo: File): Promise<LecturaDeCaminos> {
  const formato = reconocerFormato(archivo.name);
  if (!formato) {
    return {
      ok: false,
      error:
        "Ese archivo no se puede traer. Tiene que terminar en .kml, .kmz o .gpx. En Google Earth: botón derecho sobre la carpeta, «Guardar lugar como». Si es de un reloj, bajá el GPX desde su página.",
    };
  }

  const lectura = formato === "gpx" ? await figurasDelGpx(archivo) : await leerArchivoDeGoogleEarth(archivo);
  if (!lectura.ok) return lectura;

  const separacion = separarFiguras(lectura.figuras);
  if (separacion.lineas.length === 0 && separacion.puntos.length === 0) {
    return {
      ok: false,
      error:
        separacion.omitidos.length > 0
          ? `El archivo no trae ninguna línea ni ningún punto que se pueda usar. ${separacion.omitidos[0].motivo}`
          : "El archivo no trae ninguna línea ni ningún punto. Fijate de exportar la carpeta con lo que dibujaste.",
    };
  }

  return { ok: true, formato, ...separacion };
}

function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio ? limpio : null;
}

/** La descripción: texto común, o el HTML que manda Google Earth adentro de un objeto. */
function descripcionDe(propiedades: Record<string, unknown>): { descripcion: string | null; descripcionEsHtml: boolean } {
  const cruda = propiedades.description ?? propiedades.desc ?? propiedades.cmt;
  if (cruda && typeof cruda === "object" && "value" in cruda) {
    return { descripcion: texto((cruda as { value: unknown }).value), descripcionEsHtml: true };
  }
  return { descripcion: texto(cruda), descripcionEsHtml: false };
}

function colorHex(valor: unknown): string | null {
  return typeof valor === "string" && /^#[0-9a-f]{6}$/i.test(valor) ? valor.toLowerCase() : null;
}

/**
 * El color de un marcador. Google Earth en la web no lo escribe como color del
 * ícono sino adentro de la dirección del ícono (`…icon?color=1976d2…`).
 */
function colorDelPunto(propiedades: Record<string, unknown>): string | null {
  const directo = colorHex(propiedades["icon-color"]) ?? colorHex(propiedades["marker-color"]);
  if (directo) return directo;
  const icono = propiedades.icon;
  if (typeof icono !== "string") return null;
  const deEarth = /earth\.google\.com\/.*[?&]color=([0-9a-f]{6})\b/i.exec(icono);
  return deEarth ? `#${deEarth[1].toLowerCase()}` : null;
}

type Pieza =
  | { clase: "linea"; coordenadas: Position[] }
  | { clase: "punto"; coordenada: Position }
  | { clase: "omitida"; motivo: string };

const QUE_ES: Partial<Record<Geometry["type"], string>> = {
  Polygon: "Es un área, no una línea ni un punto, y se saltea.",
  MultiPolygon: "Son áreas, no líneas ni puntos, y se saltean.",
};

/** Desarma una figura en sus piezas, una por línea y una por punto. */
function piezasDe(forma: Geometry | null): Pieza[] {
  if (!forma) {
    return [{ clase: "omitida", motivo: "No tiene una ubicación que se pueda leer y se saltea." }];
  }
  switch (forma.type) {
    case "LineString":
      return [piezaDeLinea(forma.coordinates)];
    case "MultiLineString":
      return forma.coordinates.map(piezaDeLinea);
    case "Point":
      return [piezaDePunto(forma.coordinates)];
    case "MultiPoint":
      return forma.coordinates.map(piezaDePunto);
    case "GeometryCollection":
      return forma.geometries.length > 0
        ? forma.geometries.flatMap(piezasDe)
        : [{ clase: "omitida", motivo: "Es un grupo vacío y se saltea." }];
    default:
      return [{ clase: "omitida", motivo: QUE_ES[forma.type] ?? "Tiene una forma que la app no reconoce y se saltea." }];
  }
}

function piezaDeLinea(coordenadas: Position[]): Pieza {
  if (!coordenadas.every(esCoordenadaValida)) {
    return { clase: "omitida", motivo: "Tiene puntos con coordenadas imposibles y se saltea. Revisala en Google Earth." };
  }
  if (coordenadas.length < 2 || largoDeLinea(coordenadas) <= 0) {
    return { clase: "omitida", motivo: "Es una línea con un solo lugar marcado: no alcanza para dibujarla y se saltea." };
  }
  return { clase: "linea", coordenadas };
}

function piezaDePunto(coordenada: Position): Pieza {
  return esCoordenadaValida(coordenada)
    ? { clase: "punto", coordenada }
    : { clase: "omitida", motivo: "Es un punto con coordenadas imposibles y se saltea. Revisalo en Google Earth." };
}

function conAlturas(coordenadas: Position[]): boolean {
  return coordenadas.some((punto) => Number.isFinite(punto[2]) && punto[2] !== 0);
}

/**
 * Lo mismo que `leerArchivoDeCaminos`, pero desde las figuras ya leídas. Es
 * cuenta pura: se prueba sin archivos.
 */
export function separarFiguras(figuras: FeatureCollection): SeparacionDeFiguras {
  const lineas: LineaLeida[] = [];
  const puntos: PuntoLeido[] = [];
  const omitidos: ElementoOmitido[] = [];
  let orden = 0;

  figuras.features.forEach((figura: Feature, elemento) => {
    const propiedades = (figura.properties ?? {}) as Record<string, unknown>;
    const nombre = texto(propiedades.name);
    const { descripcion, descripcionEsHtml } = descripcionDe(propiedades);
    const piezas = piezasDe(figura.geometry);
    const lineasDelMarcador = piezas.filter((pieza) => pieza.clase === "linea").length;
    const puntosDelMarcador = piezas.filter((pieza) => pieza.clase === "punto").length;
    let numeroDeLinea = 0;
    let numeroDePunto = 0;

    for (const pieza of piezas) {
      if (pieza.clase === "omitida") {
        omitidos.push({ orden, elemento, nombre, motivo: pieza.motivo });
      } else if (pieza.clase === "linea") {
        numeroDeLinea += 1;
        const base = nombre ?? `Línea ${lineas.length + 1}`;
        lineas.push({
          orden,
          elemento,
          nombre,
          nombreSugerido: lineasDelMarcador > 1 ? `${base} (${numeroDeLinea} de ${lineasDelMarcador})` : base,
          descripcion,
          descripcionEsHtml,
          color: colorHex(propiedades.stroke),
          coordenadas: pieza.coordenadas,
          largoM: largoDeLinea(pieza.coordenadas),
          tieneAlturas: conAlturas(pieza.coordenadas),
        });
      } else {
        numeroDePunto += 1;
        const base = nombre ?? `Punto ${puntos.length + 1}`;
        puntos.push({
          orden,
          elemento,
          nombre,
          nombreSugerido: puntosDelMarcador > 1 ? `${base} (${numeroDePunto} de ${puntosDelMarcador})` : base,
          descripcion,
          descripcionEsHtml,
          color: colorDelPunto(propiedades),
          coordenada: pieza.coordenada,
        });
      }
      orden += 1;
    }
  });

  return { lineas, puntos, omitidos };
}
