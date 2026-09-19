/**
 * Medir distancias sobre la Tierra.
 *
 * **Está en un solo lugar a propósito.** Antes esta misma fórmula estaba
 * escrita cuatro veces en cuatro archivos, y —peor— dos de esas copias recibían
 * los números al revés que las otras: una esperaba latitud primero y la otra
 * longitud primero. Unificarlas sin mirar habría dado distancias equivocadas
 * sin que nada fallara.
 *
 * Por eso recibe **puntos con nombre y no números sueltos**: así el orden no se
 * puede confundir nunca más.
 */

export const RADIO_TIERRA_M = 6_371_000;
export const RADIO_TIERRA_KM = 6371;

export type Punto = {
  lat: number;
  lon: number;
};

export function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/** Una posición de GeoJSON, que viene como `[longitud, latitud]`. */
export function puntoDeCoordenada(coordenada: number[]): Punto {
  return { lon: coordenada[0], lat: coordenada[1] };
}

/**
 * Distancia en metros entre dos puntos, por el camino más corto sobre la
 * superficie de la Tierra.
 */
export function distanciaEnMetros(a: Punto, b: Punto): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLon = aRadianes(b.lon - a.lon);

  const mitad =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) *
      Math.cos(aRadianes(b.lat)) *
      Math.sin(dLon / 2) ** 2;

  return RADIO_TIERRA_M * 2 * Math.atan2(Math.sqrt(mitad), Math.sqrt(1 - mitad));
}

export function distanciaEnKm(a: Punto, b: Punto): number {
  return distanciaEnMetros(a, b) / 1000;
}
