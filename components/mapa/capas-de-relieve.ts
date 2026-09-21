import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import type { ColoresDelMapa } from "@/components/mapa/colores";
import { ACERCAMIENTO_MAXIMO } from "@/lib/mapas/teselas";
import {
  CAPA_DE_CURVAS,
  CLAVE_DE_ALTURA,
  CLAVE_DE_NIVEL,
  CURVAS_DESDE,
  direccionDeLasCurvas,
} from "@/lib/mapas/relieve";

/**
 * Cómo se dibujan las curvas de nivel.
 *
 * Van **encima del fondo y debajo de todo lo de la app**: los recuadros, la
 * ruta, el punto del GPS y las anotaciones siempre se ven por encima.
 *
 * **Las curvas van en magenta** porque no hay roca, pasto, agua ni tierra
 * magenta: cualquier cosa de ese color es, sin duda, un dibujo de la app. Las
 * gruesas llevan el número de altura, con borde para que no se pierda sobre
 * lo que tenga debajo. Ver docs/decisiones/013.
 */

export const FUENTE_DE_LAS_CURVAS = "curvas";

export const CURVAS_FINAS = "curvas-finas";
export const CURVAS_GRUESAS = "curvas-gruesas";
export const ALTURAS = "curvas-altura";

/** Todas, en el orden en que se apilan. La primera es la de más abajo. */
export const CAPAS_DE_RELIEVE = [CURVAS_FINAS, CURVAS_GRUESAS, ALTURAS];

const LETRA = ["Noto Sans Regular"];

export function fuenteDeLasCurvas(): SourceSpecification {
  return {
    type: "vector",
    tiles: [direccionDeLasCurvas()],
    maxzoom: ACERCAMIENTO_MAXIMO,
  };
}

export function capasDeRelieve(colores: ColoresDelMapa): LayerSpecification[] {
  return [
    {
      id: CURVAS_FINAS,
      type: "line",
      source: FUENTE_DE_LAS_CURVAS,
      "source-layer": CAPA_DE_CURVAS,
      minzoom: CURVAS_DESDE,
      filter: ["==", ["get", CLAVE_DE_NIVEL], 0],
      paint: {
        "line-color": colores.curva,
        "line-width": 0.8,
        "line-opacity": 0.7,
      },
    },
    {
      id: CURVAS_GRUESAS,
      type: "line",
      source: FUENTE_DE_LAS_CURVAS,
      "source-layer": CAPA_DE_CURVAS,
      minzoom: CURVAS_DESDE,
      filter: [">", ["get", CLAVE_DE_NIVEL], 0],
      paint: {
        "line-color": colores.curva,
        "line-width": 1.6,
        "line-opacity": 0.9,
      },
    },
    {
      id: ALTURAS,
      type: "symbol",
      source: FUENTE_DE_LAS_CURVAS,
      "source-layer": CAPA_DE_CURVAS,
      minzoom: CURVAS_DESDE + 1,
      filter: [">", ["get", CLAVE_DE_NIVEL], 0],
      layout: {
        "symbol-placement": "line",
        "text-field": ["to-string", ["get", CLAVE_DE_ALTURA]],
        "text-font": LETRA,
        "text-size": 11,
        /* Cada pedazo corta las curvas: con más espacio que esto, en muchos no
           entra ni un número. Medido el 2026-09-21 sobre Los Gigantes. */
        "symbol-spacing": 150,
      },
      paint: {
        "text-color": colores.curva,
        "text-halo-color": colores.contorno,
        "text-halo-width": 1.5,
      },
    },
  ];
}
