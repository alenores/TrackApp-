import type { Feature, FeatureCollection, LineString, Position } from "geojson";
import type { ActividadRuta } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { tramoDeLinea } from "@/lib/caminos/geometria";
import { dibujarCaminos } from "@/lib/caminos/dibujo";
import { mostrarActividad } from "@/lib/rutas/actividades";
import type { ParteDibujada } from "@/lib/circuitos/dibujo";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

/** El Circuito tiene una actividad; los Caminos visibles pueden tener otras. */
export function caminosParaArmarCircuito(
  caminos: readonly CaminoGuardado[],
  actividadDelCircuito: ActividadRuta,
  actividadesVisibles: readonly ActividadRuta[],
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: caminos.flatMap((camino) => {
      const actividadMostrada = camino.actividades.includes(actividadDelCircuito)
        && actividadesVisibles.includes(actividadDelCircuito)
        ? actividadDelCircuito
        : actividadesVisibles.find((actividad) => camino.actividades.includes(actividad));
      if (!actividadMostrada || camino.eliminadoEn) return [];
      return dibujarCaminos([camino], actividadMostrada).features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          actividades: camino.actividades,
          actividades_texto: camino.actividades.map((actividad) => mostrarActividad(actividad).etiqueta).join(" · "),
          actividad_mostrada: actividadMostrada,
          otra_actividad: actividadMostrada !== actividadDelCircuito,
        },
      }));
    }),
  };
}

export type PropiedadDeParteDelCircuito = {
  clase: "propia" | "camino";
  camino_id: number | null;
  camino_nombre: string | null;
  actividad_del_camino: ActividadRuta | null;
  camino_retirado: boolean;
  paso: string | null;
  complejidad: string | null;
  otra_actividad: boolean;
};

function feature(coordenadas: Position[], propiedades: PropiedadDeParteDelCircuito): Feature<LineString, PropiedadDeParteDelCircuito> {
  return {
    type: "Feature" as const,
    properties: propiedades,
    geometry: { type: "LineString" as const, coordinates: coordenadas },
  };
}

/**
 * La parte propia es siempre neutra y continua. La parte tomada de un Camino
 * se corta donde cambia su clasificación para conservar sus colores y marcas.
 */
export function partesDelCircuitoEnElMapa(
  partes: readonly ParteDibujada[],
  caminos: readonly CaminoGuardado[],
  actividadDelCircuito: ActividadRuta,
): Resultado<FeatureCollection<LineString, PropiedadDeParteDelCircuito>> {
  const porId = new Map(caminos.map((camino) => [camino.id, camino]));
  const features: Array<Feature<LineString, PropiedadDeParteDelCircuito>> = [];
  for (const parte of partes) {
    if (parte.tipo === "libre") {
      features.push(feature(parte.coordenadas, {
        clase: "propia", camino_id: null, camino_nombre: null, actividad_del_camino: null,
        camino_retirado: false, paso: null, complejidad: null, otra_actividad: false,
      }));
      continue;
    }
    const camino = parte.caminoId === null ? null : porId.get(parte.caminoId);
    if (!camino || parte.desdeM === null || parte.hastaM === null) {
      return falla("Falta un Camino que usa este Circuito. Poné la app al día con señal antes de salir.");
    }
    if (parte.versionForma !== camino.versionForma) {
      return falla(`El Camino «${camino.nombre}» cambió de forma. Actualizá el Circuito con señal antes de salir.`);
    }
    const desdeParte = parte.desdeM;
    const hastaParte = parte.hastaM;
    // El filtro afecta el fondo, no cambia la actividad con que se tomó
    // este tramo. Si se apaga Trekking, un tramo tomado de Trekking sigue
    // visible y conservando sus marcas dentro del Circuito.
    const actividad = parte.actividadDelCamino;
    if (!actividad || !camino.actividades.includes(actividad)) {
      return falla(`El Camino «${camino.nombre}» ya no tiene la actividad con que se sumó al Circuito. Revisalo antes de salir.`);
    }
    const vuelta = parte.sentido === "vuelta";
    const cruces = camino.partes.filter((cada) => cada.desdeM < hastaParte && cada.hastaM > desdeParte);
    if (vuelta) cruces.reverse();
    if (cruces.length === 0) return falla("Una parte del Circuito quedó fuera de su Camino. Abrilo con señal para revisarlo.");
    for (const cada of cruces) {
      const desde = Math.max(cada.desdeM, desdeParte);
      const hasta = Math.min(cada.hastaM, hastaParte);
      const coordenadas = tramoDeLinea(camino.coordenadas, desde, hasta);
      const clasificacion = cada.porActividad[actividad];
      if (!clasificacion) {
        return falla(`Falta la información de ${camino.nombre} para la actividad con que se sumó al Circuito. Revisá el Camino antes de salir.`);
      }
      features.push(feature(vuelta ? coordenadas.reverse() : coordenadas, {
        clase: "camino",
        camino_id: camino.id,
        camino_nombre: camino.nombre,
        actividad_del_camino: actividad,
        camino_retirado: camino.eliminadoEn !== null,
        paso: clasificacion.paso,
        complejidad: clasificacion.complejidad,
        otra_actividad: actividad !== actividadDelCircuito,
      }));
    }
  }
  return exito({ type: "FeatureCollection", features });
}
