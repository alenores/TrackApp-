import type { Position } from "geojson";
import { distanciaEnMetros, puntoDeCoordenada } from "@/lib/geo";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { distanciasAcumuladas, ubicarEnLinea } from "@/lib/caminos/geometria";

/**
 * Hasta acá se considera que el toque «cae sobre la línea» y se inserta un
 * punto entre dos existentes. Más lejos, se alarga desde el extremo más cerca
 * (Ale, 2026-11-03: indicar que el Camino sigue un poco más).
 */
export const ALEJAMIENTO_PARA_INSERTAR_M = 40;

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

/**
 * Agrega un punto sobre la línea, o la alarga en recta hasta el toque si cae
 * más allá de un extremo (Ale, 2026-11-03).
 */
export function agregarOExtenderPuntoEnLinea(linea: Position[], lon: number, lat: number): Resultado<Position[]> {
  if (linea.length < 2) return falla("La línea necesita al menos dos puntos.");
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return falla("No se pudo ubicar ese punto. Probá de nuevo.");
  }
  const lugar = ubicarEnLinea(linea, lon, lat);
  if (lugar && lugar.alejamientoM <= ALEJAMIENTO_PARA_INSERTAR_M) {
    const insertado = agregarPuntoEnLinea(linea, lon, lat);
    if (insertado.ok) return insertado;
  }
  const inicio = linea[0];
  const final = linea[linea.length - 1];
  const alInicio = distanciaEnMetros(puntoDeCoordenada(inicio), { lon, lat });
  const alFinal = distanciaEnMetros(puntoDeCoordenada(final), { lon, lat });
  const nuevo: Position = [lon, lat];
  if (alInicio <= alFinal) {
    return exito([nuevo, ...linea.map((p) => [...p] as Position)]);
  }
  return exito([...linea.map((p) => [...p] as Position), nuevo]);
}

/** La línea no puede perder sus dos últimos puntos. */
export function quitarPuntoDeLinea(linea: Position[], indice: number): Resultado<Position[]> {
  if (!Number.isInteger(indice) || indice < 0 || indice >= linea.length) return falla("Ese punto ya no está en la línea. Volvé a elegirlo.");
  if (linea.length <= 2) return falla("El Camino necesita al menos dos puntos. No se quitó nada.");
  return exito(linea.filter((_, i) => i !== indice).map((p) => [...p]));
}
