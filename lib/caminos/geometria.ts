import type { Position } from "geojson";
import { distanciaEnMetros, puntoDeCoordenada } from "@/lib/geo";

/**
 * La geometría de la línea de un Camino: medirla, ubicar un toque sobre ella y
 * recortar un tramo entre dos distancias.
 *
 * **Todo se mide en metros desde el comienzo de la línea.** Así una parte se
 * describe con dos números (desde y hasta) y no con una copia de sus puntos:
 * partirla o volver a clasificarla nunca toca el dibujo.
 *
 * Cuenta pura, sin pantalla ni base, para poder probarla entera. La idea de
 * ubicar y recortar sale del prototipo de partes de ruta; acá se rehízo aparte
 * para no depender de un código que todavía no se aprobó.
 */

/** Una posición usable: longitud y latitud de verdad, dentro del mundo. */
export function esCoordenadaValida(punto: Position | undefined): boolean {
  return (
    Array.isArray(punto) &&
    punto.length >= 2 &&
    Number.isFinite(punto[0]) &&
    Number.isFinite(punto[1]) &&
    punto[0] >= -180 &&
    punto[0] <= 180 &&
    punto[1] >= -90 &&
    punto[1] <= 90
  );
}

function metros(a: Position, b: Position): number {
  return distanciaEnMetros(puntoDeCoordenada(a), puntoDeCoordenada(b));
}

/** Cuántos metros hay desde el comienzo hasta cada punto de la línea. */
export function distanciasAcumuladas(coordenadas: Position[]): number[] {
  const acumuladas = [0];
  for (let i = 1; i < coordenadas.length; i += 1) {
    acumuladas.push(acumuladas[i - 1] + metros(coordenadas[i - 1], coordenadas[i]));
  }
  return acumuladas;
}

export function largoDeLinea(coordenadas: Position[]): number {
  if (coordenadas.length < 2) return 0;
  const acumuladas = distanciasAcumuladas(coordenadas);
  return acumuladas[acumuladas.length - 1];
}

/** La altura solo se interpola si los dos extremos la tienen. */
function interpolar(a: Position, b: Position, t: number): Position {
  // En los extremos, el punto original tal cual: sin redondeos que lo corran.
  if (t <= 0) return a;
  if (t >= 1) return b;
  const lon = a[0] + (b[0] - a[0]) * t;
  const lat = a[1] + (b[1] - a[1]) * t;
  if (Number.isFinite(a[2]) && Number.isFinite(b[2])) {
    return [lon, lat, (a[2] as number) + ((b[2] as number) - (a[2] as number)) * t];
  }
  return [lon, lat];
}

/** El segmento donde cae una distancia y cuánto se avanzó dentro de él. */
function ubicarDistancia(acumuladas: number[], distanciaM: number): { segmento: number; t: number } {
  const ultimo = acumuladas.length - 1;
  if (distanciaM <= 0) return { segmento: 1, t: 0 };
  if (distanciaM >= acumuladas[ultimo]) return { segmento: ultimo, t: 1 };
  for (let i = 1; i <= ultimo; i += 1) {
    if (acumuladas[i] >= distanciaM) {
      const largoDelSegmento = acumuladas[i] - acumuladas[i - 1];
      return {
        segmento: i,
        t: largoDelSegmento === 0 ? 0 : (distanciaM - acumuladas[i - 1]) / largoDelSegmento,
      };
    }
  }
  return { segmento: ultimo, t: 1 };
}

/** El lugar de la línea que está a tantos metros del comienzo. */
export function puntoEnDistancia(coordenadas: Position[], distanciaM: number): Position {
  const acumuladas = distanciasAcumuladas(coordenadas);
  const { segmento, t } = ubicarDistancia(acumuladas, distanciaM);
  return interpolar(coordenadas[segmento - 1], coordenadas[segmento], t);
}

/**
 * Los puntos del tramo entre dos distancias: el comienzo y el final exactos,
 * y en el medio los puntos originales de la línea, sin tocarlos.
 */
export function tramoDeLinea(coordenadas: Position[], desdeM: number, hastaM: number): Position[] {
  const acumuladas = distanciasAcumuladas(coordenadas);
  const inicio = ubicarDistancia(acumuladas, desdeM);
  const final = ubicarDistancia(acumuladas, hastaM);
  const tramo = [interpolar(coordenadas[inicio.segmento - 1], coordenadas[inicio.segmento], inicio.t)];
  for (let i = inicio.segmento; i < final.segmento; i += 1) {
    if (acumuladas[i] > desdeM && acumuladas[i] < hastaM) tramo.push(coordenadas[i]);
  }
  tramo.push(interpolar(coordenadas[final.segmento - 1], coordenadas[final.segmento], final.t));
  return tramo;
}

export type LugarEnLaLinea = {
  /** Metros desde el comienzo de la línea. */
  distanciaM: number;
  /** El punto de la línea más cercano al toque. */
  coordenada: Position;
  /** Cuántos metros separan el toque de la línea. */
  alejamientoM: number;
};

/**
 * El lugar de la línea más cercano a un toque.
 *
 * Para elegir el segmento alcanza con aplanar el terreno alrededor del toque:
 * a la escala de un sendero la diferencia con la esfera no se nota.
 */
export function ubicarEnLinea(coordenadas: Position[], lon: number, lat: number): LugarEnLaLinea | null {
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || coordenadas.length < 2) return null;
  const acumuladas = distanciasAcumuladas(coordenadas);
  const escalaLon = Math.cos((lat * Math.PI) / 180);
  let mejor: { distanciaM: number; coordenada: Position; aplanada: number } | null = null;

  for (let i = 1; i < coordenadas.length; i += 1) {
    const a = coordenadas[i - 1];
    const b = coordenadas[i];
    const dx = (b[0] - a[0]) * escalaLon;
    const dy = b[1] - a[1];
    const divisor = dx * dx + dy * dy;
    const t = divisor === 0
      ? 0
      : Math.max(0, Math.min(1, (((lon - a[0]) * escalaLon) * dx + (lat - a[1]) * dy) / divisor));
    const coordenada = interpolar(a, b, t);
    const aplanada = Math.hypot((lon - coordenada[0]) * escalaLon, lat - coordenada[1]);
    if (!mejor || aplanada < mejor.aplanada) {
      mejor = {
        distanciaM: acumuladas[i - 1] + (acumuladas[i] - acumuladas[i - 1]) * t,
        coordenada,
        aplanada,
      };
    }
  }

  if (!mejor) return null;
  return {
    distanciaM: mejor.distanciaM,
    coordenada: mejor.coordenada,
    alejamientoM: metros([lon, lat], mejor.coordenada),
  };
}
