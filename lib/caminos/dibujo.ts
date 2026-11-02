import type { FeatureCollection, LineString } from "geojson";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { dibujoDeLasPartes } from "@/lib/caminos/partes";
import type { ComplejidadDeParte, PasoDeParte } from "@/lib/rutas/partes";

const TOPE_DE_DESCRIPCION_AL_PASAR = 90;

function textoDelPaso(paso: PasoDeParte, actividad: ActividadRuta | null): string {
  if (paso === "por_explorar") return "Por explorar";
  if (paso === "tentativo") return "Tentativo";
  if (paso === "sin_paso") return "Sin paso";
  if (paso === "transitable") {
    if (actividad === "mountain_bike") return "En bici";
    if (actividad === "kayak") return "En kayak";
    return "Transitable";
  }
  if (actividad === "mountain_bike") return "A pie con la bici";
  if (actividad === "kayak") return "A pie con el kayak";
  return "A pie con equipo";
}

function textoDeComplejidad(complejidad: ComplejidadDeParte): string {
  if (complejidad === "facil") return "Fácil";
  if (complejidad === "media") return "Media";
  if (complejidad === "dificil") return "Difícil";
  return "Sin clasificar";
}

function acortarDescripcion(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length <= TOPE_DE_DESCRIPCION_AL_PASAR) return limpio;
  return `${limpio.slice(0, TOPE_DE_DESCRIPCION_AL_PASAR - 1).trimEnd()}…`;
}

/**
 * Texto de la pantallita al pasar el mouse por un Camino en Consultas/Marcas:
 * nombre, descripción y la clasificación de esa parte.
 */
export function etiquetaAlPasarPorCamino(entrada: {
  nombre: string;
  descripcion: string | null;
  indiceDeParte: number;
  cuantasPartes: number;
  actividad: ActividadRuta | null;
  paso: PasoDeParte | "otra_actividad";
  complejidad: ComplejidadDeParte;
}): string {
  const lineas = [entrada.nombre.trim() || "Camino"];
  if (entrada.descripcion?.trim()) lineas.push(acortarDescripcion(entrada.descripcion));
  if (entrada.paso === "otra_actividad") {
    lineas.push("Sin clasificación para la actividad elegida");
  } else {
    const paso = textoDelPaso(entrada.paso, entrada.actividad);
    const parte = entrada.cuantasPartes > 1
      ? `Parte ${entrada.indiceDeParte + 1} · ${paso}`
      : paso;
    // «Sin paso» no lleva complejidad (decisión 062).
    const conComplejidad = entrada.paso !== "sin_paso" && entrada.complejidad;
    lineas.push(conComplejidad ? `${parte} · ${textoDeComplejidad(entrada.complejidad)}` : parte);
  }
  return lineas.join("\n");
}

/** Datos de presentación: las clasificaciones guardadas nunca se modifican al cambiar la actividad principal. */
export function dibujarCaminos(
  caminos: readonly CaminoGuardado[],
  actividadPrincipal: ActividadRuta | null,
  conIconos = false,
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: caminos.flatMap((camino) => {
      const dibujo = dibujoDeLasPartes(camino);
      return dibujo.map(({ parte, coordenadas }, indice) => {
        const clasificacion = actividadPrincipal !== null && camino.actividades.includes(actividadPrincipal)
          ? parte.porActividad[actividadPrincipal]
          : undefined;
        const paso = clasificacion?.paso ?? "otra_actividad";
        const complejidad = clasificacion?.complejidad ?? null;
        return {
          type: "Feature" as const,
          properties: {
            camino_id: camino.id,
            parte_indice: indice,
            nombre: camino.nombre,
            ...(conIconos ? { icono_actividades: `actividades-${ACTIVIDADES_RUTA.filter((cada) => camino.actividades.includes(cada)).join("-")}` } : {}),
            paso,
            complejidad,
            etiqueta_al_pasar: etiquetaAlPasarPorCamino({
              nombre: camino.nombre,
              descripcion: camino.descripcion,
              indiceDeParte: indice,
              cuantasPartes: dibujo.length,
              actividad: actividadPrincipal,
              paso,
              complejidad,
            }),
          },
          geometry: { type: "LineString" as const, coordinates: coordenadas },
        };
      });
    }),
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
