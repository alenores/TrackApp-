import type { Position } from "geojson";
import { rectanguloQueAbarca, seSuperponen } from "@/lib/datos/rectangulo";
import type { GrupoDeLaLista } from "@/lib/marcas/lista";
import type { Rectangulo } from "@/types/database";

/**
 * Qué de la lista de Marcas entra en el pedazo de mapa que se está mirando
 * (decisión 057).
 *
 * Si asoma apenas —una punta de zona, un Camino que cruza el borde— queda.
 * Si está entero afuera, no. El mapa sigue dibujando lo tildado: esto solo
 * achica la lista.
 */

export type LugarEnElMapa =
  | { forma: "punto"; lon: number; lat: number }
  | { forma: "linea"; coordenadas: Position[] }
  | { forma: "zona"; rectangulo: Rectangulo };

const EPSILON = 1e-10;

function signo(valor: number): number {
  if (valor > EPSILON) return 1;
  if (valor < -EPSILON) return -1;
  return 0;
}

function orientacion(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return signo((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
}

function sobre(px: number, py: number, ax: number, ay: number, bx: number, by: number): boolean {
  return px <= Math.max(ax, bx) + EPSILON && px >= Math.min(ax, bx) - EPSILON
    && py <= Math.max(ay, by) + EPSILON && py >= Math.min(ay, by) - EPSILON;
}

/** ¿Los dos segmentos se tocan, aunque sea en un extremo? */
function segmentosSeCruzan(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): boolean {
  const o1 = orientacion(ax, ay, bx, by, cx, cy);
  const o2 = orientacion(ax, ay, bx, by, dx, dy);
  const o3 = orientacion(cx, cy, dx, dy, ax, ay);
  const o4 = orientacion(cx, cy, dx, dy, bx, by);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && sobre(cx, cy, ax, ay, bx, by)) return true;
  if (o2 === 0 && sobre(dx, dy, ax, ay, bx, by)) return true;
  if (o3 === 0 && sobre(ax, ay, cx, cy, dx, dy)) return true;
  if (o4 === 0 && sobre(bx, by, cx, cy, dx, dy)) return true;
  return false;
}

function puntoAdentro(lon: number, lat: number, vista: Rectangulo): boolean {
  return lon >= vista.lonOeste && lon <= vista.lonEste && lat >= vista.latSur && lat <= vista.latNorte;
}

function lineaAsoma(coordenadas: Position[], vista: Rectangulo): boolean {
  if (coordenadas.length === 0) return false;
  const caja = rectanguloQueAbarca(coordenadas.map((punto) => [punto[0], punto[1]]));
  if (!caja || !seSuperponen(caja, vista)) return false;
  if (coordenadas.some((punto) => puntoAdentro(punto[0], punto[1], vista))) return true;
  const bordes: Array<[[number, number], [number, number]]> = [
    [[vista.lonOeste, vista.latSur], [vista.lonEste, vista.latSur]],
    [[vista.lonEste, vista.latSur], [vista.lonEste, vista.latNorte]],
    [[vista.lonEste, vista.latNorte], [vista.lonOeste, vista.latNorte]],
    [[vista.lonOeste, vista.latNorte], [vista.lonOeste, vista.latSur]],
  ];
  for (let indice = 1; indice < coordenadas.length; indice += 1) {
    const desde = coordenadas[indice - 1];
    const hasta = coordenadas[indice];
    if (bordes.some(([a, b]) => segmentosSeCruzan(desde[0], desde[1], hasta[0], hasta[1], a[0], a[1], b[0], b[1]))) {
      return true;
    }
  }
  return false;
}

/** ¿Este lugar asoma en el pedazo de mapa? */
export function asomaEnLaVista(lugar: LugarEnElMapa, vista: Rectangulo): boolean {
  if (lugar.forma === "punto") return puntoAdentro(lugar.lon, lugar.lat, vista);
  if (lugar.forma === "zona") return seSuperponen(lugar.rectangulo, vista);
  return lineaAsoma(lugar.coordenadas, vista);
}

/**
 * ¿Esta marca se lista?
 *
 * Sin vista todavía, se lista todo: el mapa no dijo qué se está mirando.
 * Sin lugar, se conserva solo mientras la línea del Camino sigue abriéndose.
 */
export function entraEnLoQueSeMira(
  lugar: LugarEnElMapa | null,
  vista: Rectangulo | null,
  conservarHastaTenerLugar: boolean,
): boolean {
  if (!vista) return true;
  if (!lugar) return conservarHastaTenerLugar;
  return asomaEnLaVista(lugar, vista);
}

/** El lugar de una marca, para saber si entra en la vista. Sin línea, `null`. */
export function lugarDeMarca(
  marca: { grupo: GrupoDeLaLista; id: number },
  caminos: ReadonlyMap<number, { coordenadas: Position[] }>,
  detalles: ReadonlyMap<number, { geometria: { type: "Point"; coordinates: number[] } | { type: "LineString"; coordinates: Position[] } }>,
  zonas: ReadonlyMap<number, { rectangulo: Rectangulo }>,
): LugarEnElMapa | null {
  if (marca.grupo === "zona") {
    const zona = zonas.get(marca.id);
    return zona ? { forma: "zona", rectangulo: zona.rectangulo } : null;
  }
  if (marca.grupo === "camino") {
    const coordenadas = caminos.get(marca.id)?.coordenadas;
    return coordenadas && coordenadas.length > 0 ? { forma: "linea", coordenadas } : null;
  }
  const geometria = detalles.get(marca.id)?.geometria;
  if (!geometria) return null;
  if (geometria.type === "Point") {
    const [lon, lat] = geometria.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    return { forma: "punto", lon, lat };
  }
  return geometria.coordinates.length > 0 ? { forma: "linea", coordenadas: geometria.coordinates } : null;
}
