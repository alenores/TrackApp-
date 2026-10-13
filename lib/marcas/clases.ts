import type { Anotacion } from "@/types/database";

/**
 * **Marcas**: todo lo que se dibuja encima del mapa (decisión 052). Son cinco
 * clases, y cada una se llama siempre igual:
 *
 * - **Camino**: por dónde se puede pasar, con actividades y clasificación.
 * - **Punto**: un lugar, con su ícono.
 * - **Trazo**: una línea dibujada para mirar, con color.
 * - **Tranquera** y **alambrado**: los trae OpenStreetMap solos al crear o
 *   agrandar una zona. Quedan fijos: no se corrigen ni se borran.
 *
 * Un punto con ícono de tranquera marcado a mano es un **punto**: tranquera es
 * solo lo que vino de OpenStreetMap.
 */
export type ClaseDeMarca = "camino" | "punto" | "trazo" | "tranquera" | "alambrado";

/** Las clases que no son Caminos: las guarda la tabla vieja de anotaciones. */
export type ClaseDeDetalle = Exclude<ClaseDeMarca, "camino">;

export const NOMBRE_DE_LA_CLASE: Record<ClaseDeMarca, { una: string; varias: string }> = {
  camino: { una: "Camino", varias: "Caminos" },
  punto: { una: "Punto", varias: "Puntos" },
  trazo: { una: "Trazo", varias: "Trazos" },
  tranquera: { una: "Tranquera", varias: "Tranqueras" },
  alambrado: { una: "Alambrado", varias: "Alambrados" },
};

export function claseDelDetalle(anotacion: Pick<Anotacion, "tipo" | "origen">): ClaseDeDetalle {
  if (anotacion.origen === "openstreetmap") return anotacion.tipo === "punto" ? "tranquera" : "alambrado";
  return anotacion.tipo;
}

/** Tranqueras y alambrados quedan como vinieron de OpenStreetMap. */
export function esFija(anotacion: Pick<Anotacion, "origen">): boolean {
  return anotacion.origen === "openstreetmap";
}
