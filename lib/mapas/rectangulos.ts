import type { Cobertura } from "@/lib/cobertura";
import { seSuperponen } from "@/lib/datos/rectangulo";
import type { Rectangulo, Zona } from "@/types/database";

/**
 * Qué rectángulos se dibujan sobre el mapa, y de qué clase es cada uno.
 *
 * **Lo valioso es mirar, no leer.** Con la ruta dibujada encima de su zona y de
 * sus sectores, se ve de un vistazo si queda cubierta. Un kilómetro sin mapa
 * adentro de un pueblo no es lo mismo que uno en el filo, y eso no hay número
 * que lo diga: se ve.
 *
 * Cada clase se dibuja distinto, y el orden importa: primero las zonas, que son
 * grandes y van abajo; después los sectores, que van encima.
 */

export type ClaseDeRectangulo =
  /** El que se está marcando ahora, en la pantalla de crear o editar. */
  | "nuevo"
  /** La zona: territorio ya organizado. Es referencia, no promesa. */
  | "zona"
  /** Un sector, sin decir nada de su mapa. Lo usan las pantallas de armar. */
  | "sector"
  /** Un sector con el mapa ya en el celular. */
  | "sector_bajado"
  /** Un sector al que le falta bajar el mapa. */
  | "sector_sin_bajar";

export type RectanguloEnElMapa = {
  rectangulo: Rectangulo;
  clase: ClaseDeRectangulo;
};

/** Lo mismo de siempre, para las pantallas que solo muestran vecinos. */
export function comoSectores(rectangulos: Rectangulo[]): RectanguloEnElMapa[] {
  return rectangulos.map((rectangulo) => ({ rectangulo, clase: "sector" as const }));
}

/** Las zonas que la ruta toca. Puede no tocar ninguna, o tocar cinco. */
export function zonasQueCruza(
  rectanguloDeLaRuta: Rectangulo,
  zonas: Zona[],
): Zona[] {
  return zonas.filter((zona) => seSuperponen(zona.rectangulo, rectanguloDeLaRuta));
}

/**
 * Los rectángulos de una ruta: sus zonas abajo y sus sectores arriba.
 *
 * Los sectores salen de la cobertura, que ya los cruzó contra la línea de
 * verdad; las zonas salen del rectángulo que abarca la ruta, que para una
 * referencia alcanza y sobra.
 */
export function rectangulosDeLaRuta(
  cobertura: Cobertura,
  zonas: Zona[],
  rectanguloDeLaRuta: Rectangulo,
): RectanguloEnElMapa[] {
  const deLasZonas: RectanguloEnElMapa[] = zonasQueCruza(
    rectanguloDeLaRuta,
    zonas,
  ).map((zona) => ({ rectangulo: zona.rectangulo, clase: "zona" as const }));

  const deLosSectores: RectanguloEnElMapa[] = cobertura.sectores.map((cada) => ({
    rectangulo: cada.sector.rectangulo,
    clase:
      cada.estado === "descargado"
        ? ("sector_bajado" as const)
        : ("sector_sin_bajar" as const),
  }));

  return [...deLasZonas, ...deLosSectores];
}

/**
 * Qué clases hay de verdad dibujadas, en el orden en que se explican.
 *
 * La referencia solo nombra lo que está en pantalla: explicar un color que no
 * se ve confunde más de lo que ayuda.
 */
export function clasesDibujadas(
  rectangulos: RectanguloEnElMapa[],
): ClaseDeRectangulo[] {
  const ORDEN: ClaseDeRectangulo[] = [
    "nuevo",
    "zona",
    "sector",
    "sector_bajado",
    "sector_sin_bajar",
  ];
  const hay = new Set(rectangulos.map((cada) => cada.clase));
  return ORDEN.filter((clase) => hay.has(clase));
}
