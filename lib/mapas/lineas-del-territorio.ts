import type { Sector, Zona } from "@/types/database";
import { zonasEnElMapaGeneral } from "@/lib/mapas/general";
import { sectoresEnElMapa, type RectanguloEnElMapa } from "@/lib/mapas/rectangulos";

/**
 * Qué líneas de territorio se dibujan.
 *
 * Los sectores no van solos: si se ven, es encima de las zonas. «Nada» apaga
 * las dos. En Consultas abre en zonas; al marcar un punto, un Camino o un
 * trazo abre en nada.
 */
export type VistaDeLineas = "nada" | "zonas" | "zonas_y_sectores";

export const OPCIONES_DE_LINEAS: { valor: VistaDeLineas; etiqueta: string }[] = [
  { valor: "nada", etiqueta: "Nada" },
  { valor: "zonas", etiqueta: "Zonas" },
  { valor: "zonas_y_sectores", etiqueta: "Zonas y sectores" },
];

/** Las líneas que corresponden a lo elegido. Sin zonas, tampoco hay sectores. */
export function rectangulosDeLineas(
  zonas: readonly Zona[],
  sectores: readonly Sector[],
  vista: VistaDeLineas,
): RectanguloEnElMapa[] {
  if (vista === "nada" || zonas.length === 0) return [];
  const deLasZonas = zonasEnElMapaGeneral([...zonas]);
  if (vista === "zonas") return deLasZonas;
  const ids = new Set(zonas.map((zona) => zona.id));
  const deLosSectores = sectoresEnElMapa(sectores.filter((sector) => ids.has(sector.zonaId)));
  return [...deLasZonas, ...deLosSectores];
}
