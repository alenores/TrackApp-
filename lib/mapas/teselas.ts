import type { Rectangulo } from "@/types/database";

/**
 * De qué pedazos está hecho un mapa.
 *
 * Un mapa no se baja entero: se baja partido en cuadraditos, y cada cuadradito
 * existe repetido a distintos acercamientos. Un cuadradito se llama **tesela**
 * y se nombra con tres números: el acercamiento y su fila y columna dentro de
 * la grilla de ese acercamiento.
 *
 * Acá vive **toda** la cuenta de qué teselas hacen falta para un rectángulo.
 * Es pura matemática y no toca ni el celular ni internet, así que se puede
 * probar sola. Las medidas de una descarga salen de acá antes de bajar un solo
 * byte, para que el usuario sepa en qué se está metiendo.
 */

export type Tesela = { z: number; x: number; y: number };

/**
 * Hasta dónde se puede acercar.
 *
 * El mapa base no trae detalle más allá de este acercamiento. Acercarse más
 * igual funciona: el mapa estira el último nivel en vez de quedarse en blanco.
 */
export const ACERCAMIENTO_MAXIMO = 15;

/**
 * Desde dónde se empieza a bajar.
 *
 * Se arranca del mundo entero a propósito. Las teselas de los primeros niveles
 * son un puñado y **las comparten todos los sectores**, porque a ese
 * acercamiento el mundo entero entra en una sola: se bajan con el primer sector
 * y ya no se vuelven a bajar nunca. A cambio, el usuario que se aleja ve el
 * mapa alejarse, no un agujero negro.
 */
export const ACERCAMIENTO_MINIMO = 0;

/**
 * El límite del mundo en la proyección del mapa.
 *
 * El mapa dibuja el mundo como un cuadrado, y para lograrlo estira los polos al
 * infinito. Por eso se corta acá: más allá la cuenta no da un número.
 */
const LATITUD_LIMITE = 85.0511287798;

function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

export function claveDeTesela({ z, x, y }: Tesela): string {
  return `${z}/${x}/${y}`;
}

export function teselaDeClave(clave: string): Tesela | null {
  const partes = clave.split("/");
  if (partes.length !== 3) return null;

  const [z, x, y] = partes.map((parte) => Number(parte));
  if (![z, x, y].every((numero) => Number.isInteger(numero) && numero >= 0)) {
    return null;
  }

  return { z, x, y };
}

/** Cuántas teselas de lado tiene la grilla de un acercamiento. */
export function ladoDeLaGrilla(z: number): number {
  return 2 ** z;
}

export function columnaDeTesela(lon: number, z: number): number {
  const lado = ladoDeLaGrilla(z);
  const acotada = acotar(lon, -180, 180);
  return acotar(Math.floor(((acotada + 180) / 360) * lado), 0, lado - 1);
}

export function filaDeTesela(lat: number, z: number): number {
  const lado = ladoDeLaGrilla(z);
  const acotada = acotar(lat, -LATITUD_LIMITE, LATITUD_LIMITE);
  const enRadianes = (acotada * Math.PI) / 180;
  const proporcion =
    (1 - Math.log(Math.tan(enRadianes) + 1 / Math.cos(enRadianes)) / Math.PI) / 2;
  return acotar(Math.floor(proporcion * lado), 0, lado - 1);
}

/**
 * Los bordes en teselas de un rectángulo, para un acercamiento.
 *
 * El norte da la fila más chica porque las filas se cuentan de arriba hacia
 * abajo, al revés que las latitudes.
 */
function bordes(rectangulo: Rectangulo, z: number) {
  return {
    desdeX: columnaDeTesela(rectangulo.lonOeste, z),
    hastaX: columnaDeTesela(rectangulo.lonEste, z),
    desdeY: filaDeTesela(rectangulo.latNorte, z),
    hastaY: filaDeTesela(rectangulo.latSur, z),
  };
}

/**
 * Cuántas teselas hacen falta, sin armar la lista.
 *
 * Sirve para decirle al usuario cuánto va a bajar **antes** de empezar, sin
 * gastar memoria en una lista que puede tener miles de elementos.
 */
export function cuantasTeselas(
  rectangulo: Rectangulo,
  acercamientoMaximo: number = ACERCAMIENTO_MAXIMO,
): number {
  let total = 0;
  for (let z = ACERCAMIENTO_MINIMO; z <= acercamientoMaximo; z += 1) {
    const { desdeX, hastaX, desdeY, hastaY } = bordes(rectangulo, z);
    total += (hastaX - desdeX + 1) * (hastaY - desdeY + 1);
  }
  return total;
}

/**
 * La lista completa de teselas de un rectángulo, de lejos a cerca.
 *
 * El orden importa: si la descarga se corta a la mitad, lo que quedó bajado son
 * los acercamientos lejanos, que son los que dan la vista general.
 */
export function teselasDelRectangulo(
  rectangulo: Rectangulo,
  acercamientoMaximo: number = ACERCAMIENTO_MAXIMO,
): Tesela[] {
  const teselas: Tesela[] = [];

  for (let z = ACERCAMIENTO_MINIMO; z <= acercamientoMaximo; z += 1) {
    const { desdeX, hastaX, desdeY, hastaY } = bordes(rectangulo, z);
    for (let x = desdeX; x <= hastaX; x += 1) {
      for (let y = desdeY; y <= hastaY; y += 1) {
        teselas.push({ z, x, y });
      }
    }
  }

  return teselas;
}
