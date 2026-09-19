import type L from "leaflet";

/**
 * De dónde sale el fondo del mapa.
 *
 * Hoy **no hay ninguno**, y eso es correcto: los archivos de mapa todavía no
 * existen. Ver docs/decisiones/007-de-donde-salen-los-mapas.md
 *
 * Lo que sí funciona hoy es el modo sin mapa, que es un modo legítimo y no una
 * falla: la línea de la ruta, el punto del GPS y las anotaciones sobre fondo
 * vacío. Con eso alcanza para saber si vas por el camino o te desviaste, porque
 * el cálculo del desvío no mira el mapa.
 *
 * **Prohibido volver a poner acá los mapas de OpenStreetMap.** Su política de
 * uso prohíbe expresamente descargarlos por adelantado para usarlos sin señal,
 * que es justo lo que hace esta app, y avisan que bloquean sin aviso.
 *
 * Cuando existan los archivos, las dos capas se agregan **solo acá**: ninguna
 * pantalla tiene que enterarse.
 */

export type TipoDeFondo = "sin-mapa" | "simple" | "satelital";

export type FondoDisponible = {
  tipo: TipoDeFondo;
  /** `null` cuando no hay nada que dibujar debajo de la ruta. */
  crearCapa: (() => L.Layer) | null;
};

/**
 * Qué fondo se puede dibujar para un sector, según lo que el usuario tenga
 * descargado en el celular.
 */
export function elegirFondo(): FondoDisponible {
  // Todavía no hay archivos de mapa. No se inventa un proveedor de terceros.
  return { tipo: "sin-mapa", crearCapa: null };
}
