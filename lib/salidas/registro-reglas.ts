import { distanciaEnMetros } from "@/lib/geo";
import { diaEnPalabras } from "@/lib/fechas";

/**
 * Las reglas del registro de una salida mientras se navega, sin nada de
 * pantalla ni de guardado, para poder probarlas enteras.
 *
 * **Con la pantalla prendida y la app abierta, el GPS se anota solo.** Cuando
 * se bloquea el celular o se cambia de app, el navegador deja de dar
 * posiciones: ese tramo queda como una línea recta hasta el punto siguiente.
 */

/** Un punto registrado: dónde, a qué altura y cuándo. */
export type PuntoRegistrado = {
  lon: number;
  lat: number;
  /** Metros sobre el mar, si el GPS lo da. Muchos celulares no lo dan. */
  altura: number | null;
  /** Milisegundos desde 1970: cuándo se tomó. */
  momento: number;
  /** Cuánto podía errar, según el GPS. */
  precision: number | null;
  /** `true` si lo marcó el usuario con «Marcar acá». */
  aMano: boolean;
};

/** Más error que esto, la posición no sirve para dibujar por dónde fuiste. */
export const PRECISION_MAXIMA_M = 50;
/** Cada cuánto se anota un punto, caminando. */
export const DISTANCIA_MINIMA_M = 20;
/** Aunque no se haya movido casi nada, cada tanto se anota para no perder el rastro. */
export const TIEMPO_MAXIMO_SIN_ANOTAR_MS = 5 * 60 * 1000;
/** Lo que se mueve menos que esto, parado, es ruido del GPS. */
const MOVIMIENTO_MINIMO_M = 5;

/**
 * ¿Vale la pena anotar esta posición?
 *
 * Lo marcado a mano se anota siempre. Lo automático, si el GPS es confiable y
 * te moviste lo suficiente desde el último punto (o pasó mucho tiempo).
 */
export function hayQueAnotar(ultimo: PuntoRegistrado | null, nuevo: PuntoRegistrado): boolean {
  if (nuevo.aMano) return true;
  if (nuevo.precision !== null && nuevo.precision > PRECISION_MAXIMA_M) return false;
  if (!ultimo) return true;

  const metros = distanciaEnMetros(ultimo, nuevo);
  if (metros >= DISTANCIA_MINIMA_M) return true;
  return nuevo.momento - ultimo.momento >= TIEMPO_MAXIMO_SIN_ANOTAR_MS && metros >= MOVIMIENTO_MINIMO_M;
}

/** Los kilómetros hechos, sumando punto a punto. */
export function kilometrosRegistrados(puntos: PuntoRegistrado[]): number {
  let metros = 0;
  for (let indice = 1; indice < puntos.length; indice += 1) {
    metros += distanciaEnMetros(puntos[indice - 1], puntos[indice]);
  }
  return metros / 1000;
}

/** «Salida del 4 de octubre de 2026» o «Champaquí · 4 de octubre de 2026». */
export function tituloDelBorrador(dia: string, nombreDeLaRuta: string | null): string {
  const fecha = diaEnPalabras(dia);
  const titulo = nombreDeLaRuta ? `${nombreDeLaRuta} · ${fecha}` : `Salida del ${fecha}`;
  return titulo.slice(0, 120);
}

/** El día de un momento, en Córdoba: «2026-10-04». */
export function diaDelMomento(momento: number): string {
  return new Date(momento).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Lo registrado, como un archivo GPX: el mismo formato que se baja de un reloj.
 * Así la salida registrada usa todo lo que ya existe para un archivo GPS: la
 * línea de la portada, el mapa, los números y la descarga.
 */
export function comoGpx(nombre: string, puntos: PuntoRegistrado[]): string {
  const renglones = puntos.map((punto) => {
    const altura = punto.altura === null ? "" : `<ele>${punto.altura.toFixed(1)}</ele>`;
    const momento = `<time>${new Date(punto.momento).toISOString()}</time>`;
    return `      <trkpt lat="${punto.lat.toFixed(6)}" lon="${punto.lon.toFixed(6)}">${altura}${momento}</trkpt>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="TrackApp" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <trk><name>${escaparXml(nombre)}</name>`,
    "    <trkseg>",
    ...renglones,
    "    </trkseg>",
    "  </trk>",
    "</gpx>",
    "",
  ].join("\n");
}
