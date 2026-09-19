import type { StyleSpecification } from "maplibre-gl";

/**
 * De dónde sale el fondo del mapa.
 *
 * **Este es el único lugar de la app que sabe de dónde sale un mapa.** Ninguna
 * pantalla se entera: piden el fondo y dibujan lo que venga.
 *
 * Hay tres fondos y el usuario elige entre los dos primeros:
 *   - **simple**: el mapa vectorial con curvas de nivel;
 *   - **satelital**: la foto aérea, también con curvas encima;
 *   - **sin mapa**: fondo vacío con la línea de la ruta y el punto del GPS.
 *
 * El tercero **no es una falla, es un modo legítimo**. Alcanza para saber si
 * vas por el camino o te desviaste, porque el cálculo del desvío no mira el
 * mapa. Es lo que se ve mientras no haya archivos descargados, y hoy es lo
 * único que hay: los archivos todavía no existen.
 *
 * **Prohibido poner acá los mapas de OpenStreetMap.** Su política de uso
 * prohíbe expresamente descargarlos por adelantado para usarlos sin señal, que
 * es justo lo que hace esta app, y avisan que bloquean sin aviso. Ver
 * docs/decisiones/007-de-donde-salen-los-mapas.md
 */

export type TipoDeFondo = "sin-mapa" | "simple" | "satelital";

/**
 * El estilo del modo sin mapa: vacío.
 *
 * **Sin capa de fondo a propósito.** El color lo pone el recuadro que contiene
 * al mapa, con las variables de siempre, así cambia solo entre modo sol y modo
 * noche. Un color escrito acá quedaría fijo en los dos.
 *
 * Las capas de la ruta, el GPS y las anotaciones las agrega el mapa encima,
 * sea cual sea el fondo.
 */
function estiloSinMapa(): StyleSpecification {
  return {
    version: 8,
    // Sin fuentes: en este modo no se pide un solo byte a ningún lado.
    sources: {},
    layers: [],
  };
}

export type FondoDisponible = {
  tipo: TipoDeFondo;
  estilo: StyleSpecification;
};

/**
 * Qué fondo se puede dibujar, según lo que el usuario tenga descargado.
 *
 * Cuando existan los archivos, las dos capas se arman **acá** y el resto de la
 * app no cambia una línea.
 */
export function elegirFondo(): FondoDisponible {
  // Todavía no hay archivos de mapa. No se inventa un proveedor de terceros.
  return { tipo: "sin-mapa", estilo: estiloSinMapa() };
}

/**
 * ¿Ya se pueden descargar mapas?
 *
 * Se responde desde el mismo lugar que elige el fondo, así el día que existan
 * **no hay que tocar ninguna pantalla**.
 */
export function sePuedenDescargarMapas(): boolean {
  return elegirFondo().tipo !== "sin-mapa";
}
