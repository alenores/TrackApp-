import type { Anotacion } from "@/types/database";

/**
 * **Marcas**: todo lo que se dibuja encima del mapa (decisión 052). Son tres
 * clases, y cada una se llama siempre igual:
 *
 * - **Camino**: por dónde se puede pasar, con actividades y clasificación.
 * - **Punto**: un lugar, con su ícono. Las tranqueras son puntos.
 * - **Trazo**: una línea dibujada para mirar, con color. Los alambrados son
 *   trazos.
 *
 * Lo que trae OpenStreetMap solo al crear o agrandar una zona (tranqueras y
 * alambrados) es un punto o un trazo como cualquier otro, pero **fijo**: no se
 * corrige ni se borra. Se lo distingue por su origen, no por su clase.
 */
export type ClaseDeMarca = "camino" | "punto" | "trazo";

/** Las clases que no son Caminos: las guarda la tabla vieja de anotaciones. */
export type ClaseDeDetalle = Exclude<ClaseDeMarca, "camino">;

export const NOMBRE_DE_LA_CLASE: Record<ClaseDeMarca, { una: string; varias: string }> = {
  camino: { una: "Camino", varias: "Caminos" },
  punto: { una: "Punto", varias: "Puntos" },
  trazo: { una: "Trazo", varias: "Trazos" },
};

export function claseDelDetalle(anotacion: Pick<Anotacion, "tipo">): ClaseDeDetalle {
  return anotacion.tipo;
}

/** Lo que vino de OpenStreetMap queda como vino. */
export function esFija(anotacion: Pick<Anotacion, "origen">): boolean {
  return anotacion.origen === "openstreetmap";
}
