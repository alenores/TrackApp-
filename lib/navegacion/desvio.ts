import type { FeatureCollection, Position } from "geojson";
import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { distanciaEnMetros } from "@/lib/geo";

/**
 * A qué distancia estás de la línea de la ruta.
 *
 * **Es la función de la que más depende la seguridad del usuario.** De acá sale
 * el cartel de «Fuera de ruta» y la vibración: si mide mal, alguien sigue
 * caminando convencido de que va bien.
 *
 * No mira el mapa. Compara tu posición contra la línea guardada, así que
 * funciona igual sin mapa descargado y sin señal.
 */

/** A partir de acá se avisa que te desviaste. */
export const METROS_DE_DESVIO_QUE_AVISAN = 50;

export type EstadoDelGps =
  | "apagado"
  | "pidiendo"
  | "andando"
  | "sin_permiso"
  | "no_disponible";

/** Saca todas las líneas del recorrido, sea cual sea la forma que traiga. */
export function lineasDelRecorrido(recorrido: FeatureCollection): Position[][] {
  const lineas: Position[][] = [];

  for (const parte of recorrido.features) {
    const geometria = parte.geometry;
    if (!geometria) continue;

    if (geometria.type === "LineString") {
      lineas.push(geometria.coordinates);
      continue;
    }

    if (geometria.type === "MultiLineString") {
      lineas.push(...geometria.coordinates);
      continue;
    }

    if (geometria.type === "GeometryCollection") {
      for (const pedazo of geometria.geometries) {
        if (pedazo.type === "LineString") {
          lineas.push(pedazo.coordinates);
        } else if (pedazo.type === "MultiLineString") {
          lineas.push(...pedazo.coordinates);
        }
      }
    }
  }

  return lineas;
}

/**
 * Cuántos metros hay de tu posición hasta la línea de la ruta.
 *
 * Devuelve `Infinity` cuando el recorrido no tiene ninguna línea utilizable.
 * **Ese valor es a propósito:** así, si el recorrido viniera vacío, la app
 * avisa que estás fuera de ruta en vez de decirte que vas bien. Ante la duda,
 * avisar.
 */
export function distanciaALaRutaEnMetros(
  lat: number,
  lon: number,
  recorrido: FeatureCollection,
): number {
  const lineas = lineasDelRecorrido(recorrido);
  if (lineas.length === 0) return Infinity;

  const dondeEstoy = point([lon, lat]);
  let masCerca = Infinity;

  for (const linea of lineas) {
    if (linea.length < 2) continue;

    const cercano = nearestPointOnLine(lineString(linea), dondeEstoy);
    const [lonCercano, latCercano] = cercano.geometry.coordinates;

    if (typeof latCercano !== "number" || typeof lonCercano !== "number") {
      continue;
    }

    masCerca = Math.min(
      masCerca,
      distanciaEnMetros({ lat, lon }, { lat: latCercano, lon: lonCercano }),
    );
  }

  return masCerca;
}

/** ¿Voy por la ruta? */
export function voyPorLaRuta(
  lat: number,
  lon: number,
  recorrido: FeatureCollection,
  metrosQueAvisan: number = METROS_DE_DESVIO_QUE_AVISAN,
): boolean {
  return distanciaALaRutaEnMetros(lat, lon, recorrido) <= metrosQueAvisan;
}

/**
 * Qué decirle al usuario cuando el GPS no anda.
 *
 * Cada mensaje dice **qué pasó y qué hacer**. Prohibido «error desconocido»:
 * en el cerro, un mensaje que no informa nada es lo mismo que ningún mensaje.
 */
export function mensajeDeErrorDelGps(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "La app no tiene permiso para usar el GPS. Entrá a los ajustes del navegador, buscá los permisos de esta página y activá la ubicación.";
    case error.POSITION_UNAVAILABLE:
      return "El GPS no está dando posición. Fijate que la ubicación del celular esté prendida y salí a cielo abierto: bajo techo o entre paredes de roca puede tardar.";
    case error.TIMEOUT:
      return "El GPS tardó demasiado en dar la primera posición. Quedate quieto a cielo abierto unos segundos y probá de nuevo.";
    default:
      return "El GPS dejó de responder y no dijo por qué. Probá apagar y prender la ubicación del celular.";
  }
}
