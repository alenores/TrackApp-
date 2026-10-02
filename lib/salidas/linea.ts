import type { FeatureCollection } from "geojson";
import { lineasDelRecorrido } from "@/lib/rutas/recorrido";
import type { Rectangulo } from "@/types/database";

/**
 * La línea de una salida, para dibujarla sobre la portada.
 *
 * No se guarda el archivo entero para dibujar: se guarda una versión liviana,
 * de unos 150 puntos, que alcanza de sobra para un dibujo del tamaño de una
 * foto y pesa casi nada. Sin nada de pantalla, para poder probarlo.
 */

/** Un punto de la línea: [longitud, latitud]. */
export type PuntoDeLinea = [number, number];

export const PUNTOS_MAXIMOS = 150;

function esPunto(valor: unknown): valor is PuntoDeLinea {
  return (
    Array.isArray(valor) &&
    valor.length >= 2 &&
    Number.isFinite(valor[0]) &&
    Number.isFinite(valor[1]) &&
    Math.abs(valor[0] as number) <= 180 &&
    Math.abs(valor[1] as number) <= 90
  );
}

/**
 * Achica la línea del archivo a `maximo` puntos, repartidos parejo a lo largo
 * de todo el camino. Si el archivo trae varios tramos, se dibujan seguidos.
 */
export function simplificarLinea(
  geometria: FeatureCollection,
  maximo: number = PUNTOS_MAXIMOS,
): PuntoDeLinea[] {
  const todos = lineasDelRecorrido(geometria)
    .flat()
    .filter(esPunto)
    .map((punto): PuntoDeLinea => [punto[0], punto[1]]);

  if (todos.length < 2) return [];
  if (todos.length <= maximo) return todos.map(redondear);

  const elegidos: PuntoDeLinea[] = [];
  for (let indice = 0; indice < maximo; indice += 1) {
    const cual = Math.round((indice * (todos.length - 1)) / (maximo - 1));
    elegidos.push(redondear(todos[cual]));
  }
  return elegidos;
}

/** Cinco decimales son un metro: más es peso que no se ve. */
function redondear([lon, lat]: PuntoDeLinea): PuntoDeLinea {
  return [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
}

/** Lee lo que vino de la base. Lo que no sea una línea válida es «no hay línea». */
export function leerLinea(valor: unknown): PuntoDeLinea[] | null {
  if (!Array.isArray(valor)) return null;
  const puntos = valor.filter(esPunto).map((punto): PuntoDeLinea => [punto[0], punto[1]]);
  return puntos.length >= 2 ? puntos : null;
}

/** La línea en la forma que entiende el mapa. */
export function lineaComoColeccion(puntos: PuntoDeLinea[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: puntos },
      },
    ],
  };
}

/** El rectángulo que contiene a la línea, para encuadrar el mapa al abrir. */
export function rectanguloDeLaLinea(puntos: PuntoDeLinea[]): Rectangulo | null {
  if (puntos.length < 2) return null;
  const lons = puntos.map(([lon]) => lon);
  const lats = puntos.map(([, lat]) => lat);
  return {
    latNorte: Math.max(...lats),
    latSur: Math.min(...lats),
    lonEste: Math.max(...lons),
    lonOeste: Math.min(...lons),
  };
}

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type LineaDibujada = {
  /** El trazo, para un `<path d="…">`. */
  trazo: string;
  inicio: [number, number];
  fin: [number, number];
};

/**
 * Encaja la línea en la caja, sin deformarla y centrada.
 *
 * Un grado de longitud mide menos que uno de latitud lejos del ecuador: se
 * corrige con el coseno de la latitud, si no la línea sale estirada a lo ancho.
 * El norte queda arriba.
 */
export function dibujarLinea(puntos: PuntoDeLinea[], caja: Caja): LineaDibujada | null {
  if (puntos.length < 2) return null;

  const latitudMedia = puntos.reduce((suma, [, lat]) => suma + lat, 0) / puntos.length;
  const correccion = Math.cos((latitudMedia * Math.PI) / 180);
  const planos = puntos.map(([lon, lat]) => [lon * correccion, lat] as const);

  const xs = planos.map(([x]) => x);
  const ys = planos.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const anchoReal = maxX - minX;
  const altoReal = maxY - minY;

  // Una línea que no se movió (todo el mismo punto) no se dibuja.
  if (anchoReal === 0 && altoReal === 0) return null;

  const escala = Math.min(
    anchoReal > 0 ? caja.ancho / anchoReal : Number.POSITIVE_INFINITY,
    altoReal > 0 ? caja.alto / altoReal : Number.POSITIVE_INFINITY,
  );
  const sobraX = (caja.ancho - anchoReal * escala) / 2;
  const sobraY = (caja.alto - altoReal * escala) / 2;

  const enPantalla = planos.map(([x, y]): [number, number] => [
    Math.round((caja.x + sobraX + (x - minX) * escala) * 10) / 10,
    Math.round((caja.y + sobraY + (maxY - y) * escala) * 10) / 10,
  ]);

  return {
    trazo: enPantalla.map(([x, y], indice) => `${indice === 0 ? "M" : "L"}${x} ${y}`).join(" "),
    inicio: enPantalla[0],
    fin: enPantalla[enPantalla.length - 1],
  };
}
