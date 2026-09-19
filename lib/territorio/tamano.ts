import type { Rectangulo } from "@/types/database";

/**
 * Qué tan grande es un pedazo de territorio.
 *
 * **Acá no se estima cuánto va a pesar el mapa.** Los archivos de mapa todavía
 * no existen, así que cualquier número de megas sería inventado, y un número
 * inventado en pantalla es peor que no poner nada: el usuario lo cree.
 */

const RADIO_TIERRA_KM = 6371;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
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
