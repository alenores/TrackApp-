import { PMTiles } from "pmtiles";

/**
 * El archivo con el relieve del mundo entero: la altura del terreno.
 *
 * **Vive en internet y no se baja nunca entero.** Se le piden pedacitos, igual
 * que al mapa del mundo. Es de Mapterhorn, que empaqueta el relieve de
 * Copernicus —treinta metros por punto, medido desde satélite— en un archivo
 * único del mismo tipo que el de Protomaps. Verificado el 2026-09-21 sobre el
 * Champaquí: da 2785 m donde el cartel dice 2790.
 *
 * Cada pedazo es una imagen de 512 × 512 puntos donde el color de cada punto
 * es su altura, en la codificación «terrarium». El celular la abre y calcula
 * las curvas de nivel él solo, sin señal: ver `lib/mapas/relieve.ts`.
 *
 * **Esto corre solo en el servidor de TrackApp.** El lugar donde está el
 * archivo entrega pedazos a otro servidor pero no a un navegador. A diferencia
 * del mapa del mundo, la dirección es fija: no cambia de nombre por día.
 */

export const DIRECCION_DEL_RELIEVE = "https://download.mapterhorn.com/planet.pmtiles";

/** Hasta dónde llega el archivo. Más cerca no hay pedazos. */
export const ACERCAMIENTO_MAXIMO_DEL_RELIEVE = 12;

let abierto: PMTiles | null = null;

export function archivoDelRelieve(): PMTiles {
  abierto ??= new PMTiles(DIRECCION_DEL_RELIEVE);
  return abierto;
}
