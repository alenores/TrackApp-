import type { FeatureCollection } from "geojson";
import { kml } from "@tmcw/togeojson";
import { unzipSync } from "fflate";

/**
 * Leer el archivo que exporta Google Earth y sacarle las figuras.
 *
 * Google Earth exporta de dos formas: `.kml`, que es texto, y `.kmz`, que es
 * el mismo texto comprimido. Se aceptan las dos, porque el usuario no tiene
 * por qué saber la diferencia. Corre en el navegador, que es donde hay con
 * qué leer el XML.
 *
 * Nunca lanza: cuando algo no cierra devuelve qué pasó y qué hacer.
 */

export const FORMATOS_DE_GOOGLE_EARTH = ".kml,.kmz";

export type LecturaDeGoogleEarth =
  | { ok: true; figuras: FeatureCollection }
  | { ok: false; error: string };

const DANADO =
  "El archivo está dañado y no se puede leer. Probá exportarlo de nuevo desde Google Earth.";

async function textoDelArchivo(archivo: File): Promise<string | null> {
  const nombre = archivo.name.toLowerCase();

  if (nombre.endsWith(".kml")) return archivo.text();

  if (nombre.endsWith(".kmz")) {
    const comprimido = new Uint8Array(await archivo.arrayBuffer());
    const adentro = unzipSync(comprimido);
    const elKml = Object.keys(adentro).find((cada) => cada.toLowerCase().endsWith(".kml"));
    if (!elKml) return null;
    return new TextDecoder().decode(adentro[elKml]);
  }

  return null;
}

export async function leerArchivoDeGoogleEarth(archivo: File): Promise<LecturaDeGoogleEarth> {
  let texto: string | null;
  try {
    texto = await textoDelArchivo(archivo);
  } catch {
    return { ok: false, error: DANADO };
  }

  if (texto === null) {
    return {
      ok: false,
      error:
        "Ese archivo no es de Google Earth. Tiene que terminar en .kml o .kmz. En Google Earth: botón derecho sobre la carpeta, «Guardar lugar como».",
    };
  }

  if (!texto.trim()) return { ok: false, error: "El archivo está vacío." };

  let documento: Document;
  try {
    documento = new DOMParser().parseFromString(texto, "application/xml");
  } catch {
    return { ok: false, error: DANADO };
  }
  if (documento.querySelector("parsererror")) return { ok: false, error: DANADO };

  let figuras: FeatureCollection;
  try {
    figuras = kml(documento) as FeatureCollection;
  } catch {
    return {
      ok: false,
      error: "El archivo no tiene el formato esperado. Fijate que sea el que exportó Google Earth.",
    };
  }

  if (figuras.features.length === 0) {
    return {
      ok: false,
      error:
        "El archivo no tiene ningún marcador ni línea. Fijate de exportar la carpeta con lo que marcaste.",
    };
  }

  return { ok: true, figuras };
}
