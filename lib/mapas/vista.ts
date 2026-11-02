import { TOPE_DE_ACERCAMIENTO } from "@/components/mapa/capas-base";

/**
 * El lugar que se está mirando: centro y acercamiento.
 *
 * No es un encuadre. El encuadre calcula el acercamiento para que entre un
 * rectángulo; esta vista conserva exactamente lo que el usuario dejó.
 */
export type VistaDelMapa = {
  lon: number;
  lat: number;
  zoom: number;
};

/**
 * Acercamiento mínimo al abrir el editor sobre un punto elegido.
 *
 * Pegar una coordenada exacta no sirve si el mapa se aleja al continente:
 * hay que ver el lugar de cerca. Si la vista anterior estaba más lejos, se
 * acerca hasta acá; si estaba más cerca, se respeta (hasta el tope satelital).
 */
export const ACERCAMIENTO_AL_ELEGIR_PUNTO = 15;

/**
 * Vista para abrir el editor satelital sobre un punto elegido.
 *
 * El centro es el punto (no el centro anterior del mapa). El zoom queda entre
 * el mínimo para ver el lugar y el tope del satelital propio.
 */
export function vistaSobreElPunto(
  lon: number,
  lat: number,
  actual: Pick<VistaDelMapa, "zoom"> | null,
): VistaDelMapa {
  const pedido = actual?.zoom ?? ACERCAMIENTO_AL_ELEGIR_PUNTO;
  return {
    lon,
    lat,
    zoom: Math.min(
      Math.max(pedido, ACERCAMIENTO_AL_ELEGIR_PUNTO),
      TOPE_DE_ACERCAMIENTO.satelital,
    ),
  };
}

export type AccionDeLaCamara = "vista" | "encuadre" | "quieto";

/**
 * Decide si el mapa se mueve.
 *
 * La vista que el usuario dejó al guardar se aplica una sola vez y gana al
 * encuadre de apertura: si no, al volver el mapa salta a Córdoba. Un encuadre
 * pedido después —elegir una marca, un filtro, una búsqueda— sí lo mueve.
 */
export function accionDeLaCamara(entrada: {
  hayVistaNueva: boolean;
  hayEncuadre: boolean;
  viajar: boolean;
  encuadrarSoloAlAbrir: boolean;
  yaEncuadro: boolean;
}): AccionDeLaCamara {
  if (entrada.hayVistaNueva) return "vista";
  if (entrada.hayEncuadre && (entrada.viajar || !(entrada.encuadrarSoloAlAbrir && entrada.yaEncuadro))) {
    return "encuadre";
  }
  return "quieto";
}
