import { setWorkerUrl } from "maplibre-gl";

/**
 * Dónde está la parte del motor del mapa que procesa los datos.
 *
 * **Sin esto el mapa no dibuja nada.** El motor reparte su trabajo en dos: una
 * parte dibuja y otra procesa los datos. La segunda vive en un archivo aparte y
 * el motor la busca solo, calculando dónde quedó. Ese cálculo no funciona con
 * la forma en que se empaqueta esta app: termina cargando la página web en vez
 * de su propio código, esa parte muere al instante, y el mapa se queda
 * esperando para siempre datos que nunca llegan.
 *
 * Los archivos los deja en su lugar `scripts/copiar-motor-del-mapa.mjs`, en
 * cada compilación. Acá solo se dice dónde están.
 *
 * La dirección va completa, con el nombre del sitio adelante: el motor no
 * acepta atajos.
 */

const DONDE_ESTA = "/motor-del-mapa/maplibre-gl-worker.mjs";

let avisado = false;

export function prepararElMotorDelMapa(): void {
  if (avisado || typeof window === "undefined") return;
  setWorkerUrl(`${window.location.origin}${DONDE_ESTA}`);
  avisado = true;
}
