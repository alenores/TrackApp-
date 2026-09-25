import type { Anotacion, Rectangulo } from "@/types/database";

/**
 * Dónde cae una anotación.
 *
 * **Manda el punto, no el sector.** Una anotación marcada desde la navegación
 * no tiene sector: se guarda donde estaba el GPS, caiga o no dentro de uno.
 * Para saber si se muestra en una zona, en un sector o cerca de una ruta se
 * mira dónde está, no a qué sector se la anotó.
 */

function puntosDe(anotacion: Anotacion): [number, number][] {
  const { geometria } = anotacion;
  if (geometria.type === "Point") {
    return [[geometria.coordinates[0], geometria.coordinates[1]]];
  }
  return geometria.coordinates.map(([lon, lat]) => [lon, lat] as [number, number]);
}

/** ¿Algún pedazo de la anotación cae dentro del rectángulo? */
export function caeDentroDe(anotacion: Anotacion, rectangulo: Rectangulo): boolean {
  return puntosDe(anotacion).some(
    ([lon, lat]) =>
      lat <= rectangulo.latNorte &&
      lat >= rectangulo.latSur &&
      lon >= rectangulo.lonOeste &&
      lon <= rectangulo.lonEste,
  );
}

/**
 * Las anotaciones que corresponden a un lugar: las anotadas a esos sectores y
 * las que, sin sector, caen dentro de alguno de esos rectángulos.
 */
export function anotacionesDelLugar(
  anotaciones: Anotacion[],
  sectores: Array<{ id: number; rectangulo: Rectangulo }>,
  rectanguloExtra?: Rectangulo | null,
): Anotacion[] {
  const ids = new Set(sectores.map((sector) => sector.id));
  const rectangulos = sectores.map((sector) => sector.rectangulo);
  if (rectanguloExtra) rectangulos.push(rectanguloExtra);

  return anotaciones.filter((anotacion) =>
    anotacion.sectorId !== null
      ? ids.has(anotacion.sectorId)
      : rectangulos.some((rectangulo) => caeDentroDe(anotacion, rectangulo)),
  );
}
