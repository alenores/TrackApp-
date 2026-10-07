import type { FeatureCollection, LineString } from "geojson";
import type { ActividadRuta } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujoDeLasPartes } from "@/lib/caminos/partes";

/** Datos de presentación: las clasificaciones guardadas nunca se modifican al cambiar la actividad principal. */
export function dibujarCaminos(
  caminos: readonly CaminoGuardado[],
  actividadPrincipal: ActividadRuta,
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: caminos.flatMap((camino) => dibujoDeLasPartes(camino).map(({ parte, coordenadas }, indice) => {
      const clasificacion = parte.porActividad[actividadPrincipal];
      return {
        type: "Feature" as const,
        properties: {
          camino_id: camino.id,
          parte_indice: indice,
          nombre: camino.nombre,
          paso: clasificacion?.paso ?? "otra_actividad",
          complejidad: clasificacion?.complejidad ?? null,
        },
        geometry: { type: "LineString" as const, coordinates: coordenadas },
      };
    })),
  };
}
