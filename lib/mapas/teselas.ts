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

/**
 * Un pedazo puede ser del dibujo del mapa, del relieve o de la foto satelital.
 *
 * El relieve —la altura del terreno, de donde salen las curvas de nivel— es un
 * dato aparte del dibujo, pero **baja con el mismo sector y se cuenta igual**:
 * un pedazo más, con su nombre, en el mismo depósito. La foto satelital, lo
 * mismo: la misma grilla que el dibujo, con otro nombre adelante.
 */
export type Capa = "relieve" | "satelital";

const CAPAS: readonly Capa[] = ["relieve", "satelital"];

export type Tesela = { z: number; x: number; y: number; capa?: Capa };

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
 * El único acercamiento en que se baja el relieve.
 *
 * El dato de altura mide unos treinta metros por punto, y a este acercamiento
 * cada punto del pedazo son unos dieciséis metros en la sierra: bajar más cerca
 * no agrega detalle, solo peso. Para mirar de más lejos o de más cerca el mapa
 * estira este nivel, que para la altura del terreno es exactamente lo mismo.
 */
export const ACERCAMIENTO_DEL_RELIEVE = 12;

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

export function claveDeTesela({ z, x, y, capa }: Tesela): string {
  const grilla = `${z}/${x}/${y}`;
  return capa ? `${capa}/${grilla}` : grilla;
}

export function teselaDeClave(clave: string): Tesela | null {
  const partes = clave.split("/");
  const capa =
    partes.length === 4 && (CAPAS as readonly string[]).includes(partes[0])
      ? partes.shift()
      : undefined;
  if (partes.length !== 3) return null;

  const [z, x, y] = partes.map((parte) => Number(parte));
  if (![z, x, y].every((numero) => Number.isInteger(numero) && numero >= 0)) {
    return null;
  }

  return capa ? { z, x, y, capa: capa as Capa } : { z, x, y };
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

/** Cuántos pedazos de relieve hacen falta para un rectángulo. */
export function cuantasTeselasDelRelieve(rectangulo: Rectangulo): number {
  const { desdeX, hastaX, desdeY, hastaY } = bordes(rectangulo, ACERCAMIENTO_DEL_RELIEVE);
  return (hastaX - desdeX + 1) * (hastaY - desdeY + 1);
}

/** Los pedazos de relieve de un rectángulo: un solo acercamiento, ver arriba. */
export function teselasDelRelieve(rectangulo: Rectangulo): Tesela[] {
  const z = ACERCAMIENTO_DEL_RELIEVE;
  const { desdeX, hastaX, desdeY, hastaY } = bordes(rectangulo, z);
  const teselas: Tesela[] = [];
  for (let x = desdeX; x <= hastaX; x += 1) {
    for (let y = desdeY; y <= hastaY; y += 1) {
      teselas.push({ z, x, y, capa: "relieve" });
    }
  }
  return teselas;
}

/**
 * Los pedazos de la foto satelital de un rectángulo.
 *
 * **La misma grilla y los mismos acercamientos que el dibujo**, con otro nombre:
 * así la foto se estira y se achica igual que el mapa simple, y los pedazos
 * lejanos, que son un puñado, los comparten todos los sectores.
 */
export function teselasDeLaFoto(
  rectangulo: Rectangulo,
  acercamientoMaximo: number = ACERCAMIENTO_MAXIMO,
): Tesela[] {
  return teselasDelRectangulo(rectangulo, acercamientoMaximo).map((tesela) => ({
    ...tesela,
    capa: "satelital",
  }));
}
