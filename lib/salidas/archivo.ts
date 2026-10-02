import type { FeatureCollection } from "geojson";
import { leerArchivoDeRuta } from "@/lib/rutas/archivo";
import type { Rectangulo } from "@/types/database";

/**
 * Traer el archivo GPS de una salida para verlo en el mapa, con todo su
 * detalle. **Solo con internet**, como todo el módulo de salidas.
 *
 * La línea liviana de la portada alcanza para un dibujo, no para acercarse en
 * un mapa: ahí se ve cada curva. Si el archivo no llega, la pantalla muestra
 * la línea liviana y dice por qué.
 */

/** Más que esto, con señal floja, es mejor avisar que seguir esperando. */
const TOPE_MS = 20_000;

export type LineaCompleta =
  | { ok: true; geometria: FeatureCollection; rectangulo: Rectangulo }
  | { ok: false; motivo: string };

function nombreDelArchivo(direccion: string): string {
  try {
    const camino = new URL(direccion).pathname;
    return decodeURIComponent(camino.split("/").pop() || "salida.gpx");
  } catch {
    return "salida.gpx";
  }
}

export async function traerLaLineaCompleta(direccion: string): Promise<LineaCompleta> {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TOPE_MS);

  let contenido: Blob;
  try {
    const respuesta = await fetch(direccion, { signal: control.signal });
    if (!respuesta.ok) {
      return {
        ok: false,
        motivo: `el archivo GPS no está disponible (la base respondió ${respuesta.status})`,
      };
    }
    contenido = await respuesta.blob();
  } catch {
    return {
      ok: false,
      motivo: control.signal.aborted
        ? "el archivo GPS tardó demasiado en llegar; probá con mejor señal"
        : "no hubo conexión para traer el archivo GPS",
    };
  } finally {
    clearTimeout(corte);
  }

  const lectura = await leerArchivoDeRuta(new File([contenido], nombreDelArchivo(direccion)));
  if (!lectura.ok) return { ok: false, motivo: lectura.error };

  return {
    ok: true,
    geometria: lectura.recorrido.geometria,
    rectangulo: lectura.recorrido.rectangulo,
  };
}
