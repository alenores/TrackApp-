import { aRadianes, RADIO_TIERRA_KM } from "@/lib/geo";
import type { Rectangulo } from "@/types/database";

/**
 * Qué tan grande es un pedazo de territorio.
 *
 * **Acá no se estima cuánto va a pesar el mapa.** 
 * Bueno, ahora sí lo hacemos a pedido del usuario, pero solo como una
 * advertencia visual en la creación. Un número inventado en pantalla 
 * puede ser peligroso si no se deja claro que es estimado.
 */

export const UMBRAL_DE_RIESGO_MB = 100;
const MB_POR_KM2 = 0.5;

export function estimarPesoEnMB(rectangulo: Rectangulo): number {
  const { anchoKm, altoKm } = tamanoDelRectangulo(rectangulo);
  const areaKm2 = anchoKm * altoKm;
  return Math.round(areaKm2 * MB_POR_KM2);
}

export type TamanoDelRectangulo = {
  anchoKm: number;
  altoKm: number;
};

export function tamanoDelRectangulo(
  rectangulo: Rectangulo,
): TamanoDelRectangulo {
  const altoKm =
    (Math.abs(rectangulo.latNorte - rectangulo.latSur) * Math.PI * RADIO_TIERRA_KM) /
    180;

  // Los meridianos se juntan hacia los polos: el ancho depende de la latitud.
  const latDelMedio = aRadianes((rectangulo.latNorte + rectangulo.latSur) / 2);
  const anchoKm =
    (Math.abs(rectangulo.lonEste - rectangulo.lonOeste) *
      Math.PI *
      RADIO_TIERRA_KM *
      Math.cos(latDelMedio)) /
    180;

  return { anchoKm, altoKm };
}

/** «6,1 × 4,3 km». Coma decimal, que es como se escribe acá. */
export function mostrarTamano(rectangulo: Rectangulo): string {
  const { anchoKm, altoKm } = tamanoDelRectangulo(rectangulo);
  const numero = (valor: number) => valor.toFixed(1).replace(".", ",");
  return `${numero(anchoKm)} × ${numero(altoKm)} km`;
}
