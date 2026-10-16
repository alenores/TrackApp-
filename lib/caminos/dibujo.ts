import type { FeatureCollection, LineString } from "geojson";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";
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

/**
 * La primera actividad prendida que el Camino tiene, en el orden de siempre.
 * Si no comparte ninguna, no se muestra.
 */
export function actividadParaMostrar(
  actividadesDelCamino: readonly ActividadRuta[],
  visibles: readonly ActividadRuta[],
): ActividadRuta | null {
  return ACTIVIDADES_RUTA.find((actividad) =>
    visibles.includes(actividad) && actividadesDelCamino.includes(actividad),
  ) ?? null;
}

/** En la navegación libre solo se dibujan los Caminos de las actividades prendidas. */
export function dibujarCaminosVisibles(
  caminos: readonly CaminoGuardado[],
  visibles: readonly ActividadRuta[],
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: caminos.flatMap((camino) => {
      const actividad = actividadParaMostrar(camino.actividades, visibles);
      if (!actividad) return [];
      return dibujarCaminos([camino], actividad).features;
    }),
  };
}
