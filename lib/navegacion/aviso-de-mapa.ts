import type { FeatureCollection } from "geojson";
import { sePuedenDescargarMapas } from "@/components/mapa/capas-base";
import { calcularCobertura } from "@/lib/cobertura";
import type { Sector } from "@/types/database";

/**
 * Qué decirle al usuario cuando le falta mapa para lo que navega.
 *
 * **La navegación arranca igual.** Si alguien está en el cerro con la app
 * abierta, dejarlo sin navegación es peor que dejarlo sin fondo de mapa: la
 * línea y su punto funcionan sin mapa. Lo que no
 * se hace nunca es callárselo.
 */
export function avisoPorFaltaDeMapa(
  recorrido: FeatureCollection,
  sectoresQueLaCruzan: Sector[],
  bajados: ReadonlySet<number>,
): string | null {
  if (!sePuedenDescargarMapas()) {
    return "Estás navegando sin fondo de mapa: todavía no hay mapas cargados en la app. La línea y tu punto funcionan igual.";
  }

  const cobertura = calcularCobertura(recorrido, sectoresQueLaCruzan, bajados);
  const faltan = cobertura.sectores.filter(
    (cada) => cada.estado === "falta_descargar",
  );

  if (cobertura.metrosSinCobertura > 0) {
    const km = (cobertura.metrosSinCobertura / 1000).toFixed(1).replace(".", ",");
    return `Hay ${km} km de este Circuito sin mapa. Por ese tramo vas a ver la línea y tu punto, pero sin fondo.`;
  }

  if (faltan.length > 0) {
    return faltan.length === 1
      ? `Te falta bajar el mapa del sector ${faltan[0].sector.nombre}. Por ahí vas a navegar sin fondo.`
      : `Te faltan bajar ${faltan.length} mapas de este Circuito. Por esos tramos vas a navegar sin fondo.`;
  }

  return null;
}
