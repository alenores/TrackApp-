import type { FeatureCollection } from "geojson";
import { gpx, kml } from "@tmcw/togeojson";
import {
  calcularNumerosDelRecorrido,
  type NumerosDelRecorrido,
} from "@/lib/rutas/recorrido";

/**
 * Leer el archivo que se sube y sacarle el recorrido.
 *
 * Las rutas no se dibujan en la app: se traen ya dibujadas de otro lado. Esto
 * corre en el navegador, que es donde hay con qué leer el XML.
 *
 * El cálculo de los números vive aparte, en `recorrido.ts`, sin depender de
 * nada del navegador, así se puede probar entero.
 */

export const FORMATOS_ACEPTADOS = ".gpx,.kml";

export type RecorridoLeido = NumerosDelRecorrido & {
  geometria: FeatureCollection;
};

export type LecturaDeArchivo =
  | { ok: true; recorrido: RecorridoLeido }
  | { ok: false; error: string };

type Formato = "gpx" | "kml";

function reconocerFormato(nombre: string): Formato | null {
  const bajo = nombre.toLowerCase();
  if (bajo.endsWith(".gpx")) return "gpx";
  if (bajo.endsWith(".kml")) return "kml";
  return null;
}

/**
 * Qué clase de archivo decirle a la base que se está guardando.
 *
 * **Sale del nombre del archivo, no de lo que dice el navegador.** Windows no
 * conoce el `.gpx`, así que el navegador lo entrega como «un archivo cualquiera»
 * y la base lo rechaza, porque solo acepta las clases que declaró. El usuario
 * veía «no se pudo subir» sobre un archivo perfecto. Pasó en producción el
 * 2026-09-20.
 *
 * Que la clase sea la correcta es problema de la app, no del usuario.
 */
export function claseDelArchivoDeRuta(nombre: string): string {
  const formato = reconocerFormato(nombre);
  if (formato === "gpx") return "application/gpx+xml";
  if (formato === "kml") return "application/vnd.google-earth.kml+xml";
  return CLASE_DE_RESPALDO;
}

/**
 * La clase de respaldo, por si la base no acepta la específica.
 *
 * Un `.gpx` y un `.kml` son, los dos, XML: declararlos así es cierto, no un
 * truco. Se usa solo si el primer intento fue rechazado por la clase.
 */
export const CLASE_DE_RESPALDO = "application/xml";

/** ¿La base rechazó el archivo por su clase, y no por otra cosa? */
export function loRechazoPorLaClase(motivo: string): boolean {
  return motivo.toLowerCase().includes("mime type");
}

/**
 * Lee un archivo de recorrido y devuelve la línea más sus números.
 *
 * Nunca lanza: cuando algo no cierra devuelve qué pasó y qué hacer, porque la
 * persona tiene que poder arreglarlo sin adivinar.
 */
export async function leerArchivoDeRuta(
  archivo: File,
): Promise<LecturaDeArchivo> {
  const formato = reconocerFormato(archivo.name);

  if (!formato) {
    return {
      ok: false,
      error:
        "Ese archivo no es un recorrido. Tiene que terminar en .gpx o .kml. Si lo tenés en Google Earth, exportalo como KML; si es de un reloj, bajá el GPX desde la página del reloj.",
    };
  }

  let texto: string;
  try {
    texto = await archivo.text();
  } catch {
    return {
      ok: false,
      error: "No se pudo leer el archivo. Probá seleccionarlo de nuevo.",
    };
  }

  if (!texto.trim()) {
    return { ok: false, error: "El archivo está vacío." };
  }

  let documento: Document;
  try {
    documento = new DOMParser().parseFromString(texto, "application/xml");
  } catch {
    return {
      ok: false,
      error:
        "El archivo está dañado y no se puede leer. Probá exportarlo de nuevo desde donde lo sacaste.",
    };
  }

  if (documento.querySelector("parsererror")) {
    return {
      ok: false,
      error:
        "El archivo está dañado y no se puede leer. Probá exportarlo de nuevo desde donde lo sacaste.",
    };
  }

  let geometria: FeatureCollection;
  try {
    geometria =
      formato === "gpx"
        ? (gpx(documento) as FeatureCollection)
        : (kml(documento) as FeatureCollection);
  } catch {
    return {
      ok: false,
      error:
        "El archivo no tiene el formato esperado. Fijate que sea el archivo del recorrido y no otra cosa.",
    };
  }

  const numeros = calcularNumerosDelRecorrido(geometria);

  if (!numeros) {
    return {
      ok: false,
      error:
        "El archivo no tiene ningún recorrido dibujado. Si lo exportaste de Google Earth, fijate de exportar la línea y no solamente marcadores.",
    };
  }

  return { ok: true, recorrido: { ...numeros, geometria } };
}
