import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { distanciasAcumuladas, ubicarEnLinea } from "@/lib/caminos/geometria";

/** Suma un vértice exactamente sobre la línea, entre otros dos. No toca la clasificación. */
export function agregarPuntoEnLinea(linea: Position[], lon: number, lat: number): Resultado<Position[]> {
  const lugar = ubicarEnLinea(linea, lon, lat);
  if (!lugar) return falla("Tocá la línea del Camino entre dos puntos para agregar uno.");
  const distancias = distanciasAcumuladas(linea);
  if (distancias.some((distancia) => Math.abs(distancia - lugar.distanciaM) < 2)) {
    return falla("Ese lugar ya tiene un punto. Tocá entre dos puntos para agregar uno nuevo.");
  }
  const indice = distancias.findIndex((distancia) => distancia > lugar.distanciaM);
  if (indice <= 0) return falla("Tocá entre dos puntos de la línea para agregar uno.");
  return exito([...linea.slice(0, indice).map((p) => [...p]),
    [...lugar.coordenada], ...linea.slice(indice).map((p) => [...p])]);
}

/** La línea no puede perder sus dos últimos puntos. */
export function quitarPuntoDeLinea(linea: Position[], indice: number): Resultado<Position[]> {
  if (!Number.isInteger(indice) || indice < 0 || indice >= linea.length) return falla("Ese punto ya no está en la línea. Volvé a elegirlo.");
  if (linea.length <= 2) return falla("El Camino necesita al menos dos puntos. No se quitó nada.");
  return exito(linea.filter((_, i) => i !== indice).map((p) => [...p]));
}
