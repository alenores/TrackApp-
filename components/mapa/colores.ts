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
  parteFacil: string;
  parteMedia: string;
  parteDificil: string;
  parteSinClasificar: string;
  /** El tramo elegido o el que se está partiendo. */
  marcaDeParte: string;
  /** Un corte que ya separa dos partes. */
  marcaDeCorte: string;
  /** El recorrido de una salida: naranja con sol, claro de noche. */
  lineaDeSalida: string;
  parteX: string;
  parteXHalo: string;
  circuitoPropio: string;
  circuitoBorde: string;
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
  /**
   * Las huellas y calles sobre la foto satelital.
   *
   * En el mapa simple esas líneas son casi blancas de día y casi negras de
   * noche: sobre la foto desaparecen. Acá siguen al texto, oscuras con sol y
   * claras de noche.
   */
  texto: string;
  /** El sendero a pie, distinto del camino de auto. */
  sendero: string;
  /** Arroyos y ríos. */
  agua: string;
  /** Las curvas de nivel y sus números, sobre el mapa simple. */
  curva: string;
  /** Las mismas curvas sobre la foto satelital: naranja clarito. */
  curvaSobreFoto: string;
};

/** Por si se pregunta antes de que el navegador tenga las variables listas. */
const DE_RESPALDO: ColoresDelMapa = {
  linea: "#52b788",
  parteFacil: "#2de083",
  parteMedia: "#ffd43b",
  parteDificil: "#ff6262",
  parteSinClasificar: "#8e9aab",
  marcaDeParte: "#fb923c",
  marcaDeCorte: "#fdba74",
  lineaDeSalida: "#cbd5e1",
  parteX: "#111827",
  parteXHalo: "#ffffff",
  circuitoPropio: "#000000",
  circuitoBorde: "#ffffff",
  gps: "#60a5fa",
  anotacion: "#f472b6",
  rectanguloNuevo: "#67e8f9",
  rectanguloExistente: "#52b788",
  rectanguloZona: "#8795ab",
  rectanguloBajado: "#059669",
  rectanguloSinBajar: "#b45309",
  contorno: "#1e293b",
  texto: "#f1f5f9",
  sendero: "#e8a765",
  agua: "#5fc3e4",
  curva: "#f0abfc",
  curvaSobreFoto: "#ffc266",
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
    parteFacil: leer("--parte-facil", DE_RESPALDO.parteFacil),
    parteMedia: leer("--parte-media", DE_RESPALDO.parteMedia),
    parteDificil: leer("--parte-dificil", DE_RESPALDO.parteDificil),
    parteSinClasificar: leer("--parte-sin-clasificar", DE_RESPALDO.parteSinClasificar),
    marcaDeParte: leer("--marca-de-parte", DE_RESPALDO.marcaDeParte),
    marcaDeCorte: leer("--marca-de-corte", DE_RESPALDO.marcaDeCorte),
    lineaDeSalida: leer("--linea-de-salida", DE_RESPALDO.lineaDeSalida),
    parteX: leer("--parte-x", DE_RESPALDO.parteX),
    parteXHalo: leer("--parte-x-halo", DE_RESPALDO.parteXHalo),
    circuitoPropio: leer("--circuito-propio", DE_RESPALDO.circuitoPropio),
    circuitoBorde: leer("--circuito-borde", DE_RESPALDO.circuitoBorde),
    gps: leer("--gps", DE_RESPALDO.gps),
    anotacion: leer("--anotacion", DE_RESPALDO.anotacion),
    rectanguloNuevo: leer("--dato", DE_RESPALDO.rectanguloNuevo),
    rectanguloExistente: leer("--mapa-linea", DE_RESPALDO.rectanguloExistente),
    rectanguloZona: leer("--borde-fuerte", DE_RESPALDO.rectanguloZona),
    rectanguloBajado: leer("--verde-borde", DE_RESPALDO.rectanguloBajado),
    rectanguloSinBajar: leer("--ambar-borde", DE_RESPALDO.rectanguloSinBajar),
    contorno: leer("--superficie", DE_RESPALDO.contorno),
    texto: leer("--texto", DE_RESPALDO.texto),
    sendero: leer("--mapa-sendero", DE_RESPALDO.sendero),
    agua: leer("--mapa-agua", DE_RESPALDO.agua),
    curva: leer("--mapa-curva", DE_RESPALDO.curva),
    curvaSobreFoto: leer("--mapa-curva-foto", DE_RESPALDO.curvaSobreFoto),
  };
}

/**
 * Color de las curvas de nivel según el fondo.
 *
 * En el mapa simple siguen en magenta. Sobre la foto satelital van en naranja
 * clarito: el violeta no se distingue del terreno (Ale, 2026-10-15).
 */
export function colorDeLasCurvas(sobreLaFoto: boolean, colores: ColoresDelMapa): string {
  return sobreLaFoto ? colores.curvaSobreFoto : colores.curva;
}

/**
 * Envoltorio de la línea para que se distinga del terreno.
 *
 * Claro y continuo sobre la foto y de noche. En el mapa simple de día no
 * se usa: el fondo ya es claro y el Camino se ve con su color solo.
 */
export function colorDelEnvoltorio(
  claro: boolean,
  colores: Pick<ColoresDelMapa, "parteX" | "parteXHalo">,
): string {
  return claro ? colores.parteXHalo : colores.parteX;
}

/**
 * Color de una parte según su complejidad.
 *
 * El recorrido de una salida no tiene complejidad: va en su propio color, para
 * que con sol sea naranja y de noche siga claro.
 */
export function colorDeLasPartes(colores: ColoresDelMapa): unknown[] {
  return [
    "case",
    ["==", ["get", "lineaDeSalida"], true],
    colores.lineaDeSalida,
    [
      "match", ["get", "complejidad"],
      "facil", colores.parteFacil,
      "media", colores.parteMedia,
      "dificil", colores.parteDificil,
      colores.parteSinClasificar,
    ],
  ];
}
