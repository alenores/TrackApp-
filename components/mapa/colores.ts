/**
 * Los colores con los que el mapa dibuja.
 *
 * El mapa no entiende las clases de la app: necesita colores de verdad. Así
 * que se leen las mismas variables que usa todo el resto, y se vuelven a leer
 * cuando se cambia entre modo sol y modo noche.
 *
 * **Nunca escribir un color acá.** Si hace falta uno nuevo, se agrega a las
 * variables y se lo nombra desde este archivo.
 */

export type ColoresDelMapa = {
  linea: string;
  gps: string;
  anotacion: string;
  rectanguloNuevo: string;
  rectanguloExistente: string;
  /** La zona: referencia, no promesa. Va en gris y con línea de puntos. */
  rectanguloZona: string;
  /** El sector con el mapa ya en el celular. */
  rectanguloBajado: string;
  /** El sector al que le falta el mapa. */
  rectanguloSinBajar: string;
  /** El borde de los puntos, para que se despeguen de lo que tengan debajo. */
  contorno: string;
  /** El sendero a pie, distinto del camino de auto. */
  sendero: string;
  /** Arroyos y ríos. */
  agua: string;
};

/** Por si se pregunta antes de que el navegador tenga las variables listas. */
const DE_RESPALDO: ColoresDelMapa = {
  linea: "#52b788",
  gps: "#60a5fa",
  anotacion: "#f472b6",
  rectanguloNuevo: "#67e8f9",
  rectanguloExistente: "#52b788",
  rectanguloZona: "#8795ab",
  rectanguloBajado: "#059669",
  rectanguloSinBajar: "#b45309",
  contorno: "#1e293b",
  sendero: "#e8a765",
  agua: "#5fc3e4",
};

function leer(nombre: string, deRespaldo: string): string {
  if (typeof window === "undefined") return deRespaldo;

  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nombre)
    .trim();

  return valor || deRespaldo;
}

export function coloresDelMapa(): ColoresDelMapa {
  return {
    linea: leer("--mapa-linea", DE_RESPALDO.linea),
    gps: leer("--gps", DE_RESPALDO.gps),
    anotacion: leer("--anotacion", DE_RESPALDO.anotacion),
    rectanguloNuevo: leer("--dato", DE_RESPALDO.rectanguloNuevo),
    rectanguloExistente: leer("--mapa-linea", DE_RESPALDO.rectanguloExistente),
    rectanguloZona: leer("--borde-fuerte", DE_RESPALDO.rectanguloZona),
    rectanguloBajado: leer("--verde-borde", DE_RESPALDO.rectanguloBajado),
    rectanguloSinBajar: leer("--ambar-borde", DE_RESPALDO.rectanguloSinBajar),
    contorno: leer("--superficie", DE_RESPALDO.contorno),
    sendero: leer("--mapa-sendero", DE_RESPALDO.sendero),
    agua: leer("--mapa-agua", DE_RESPALDO.agua),
  };
}
