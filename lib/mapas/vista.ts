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
