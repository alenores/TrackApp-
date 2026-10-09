import type { Position } from "geojson";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";
import { ACERCAMIENTO_MAXIMO_DEL_RELIEVE } from "@/lib/mapas/archivo-del-relieve";

/**
 * La altura del terreno en cualquier punto, leída del mismo relieve que dibuja
 * las curvas de nivel (`lib/mapas/archivo-del-relieve.ts`).
 *
 * **Corre solo en el servidor y solo al guardar**, en la computadora y con
 * conexión. Nunca durante la navegación: lo que la navegación necesita ya viaja
 * guardado con cada Camino.
 *
 * El relieve viene en pedazos de 512 × 512 puntos, y el color de cada punto es
 * su altura en la codificación «terrarium». Se toma el pedazo más cercano que
 * existe y, adentro, se mezclan los cuatro puntos que rodean al pedido: así la
 * altura cambia suave al avanzar sobre la línea, en vez de a saltos.
 *
 * Las cuentas de esta parte son puras y se prueban; la lectura del archivo y
 * de la imagen se le pasa desde afuera (`LectorDePedazos`).
 */

/** Un pedazo ya abierto: sus puntos en fila, de a `canales` números por punto. */
export type PedazoDeRelieve = { ancho: number; alto: number; canales: number; datos: Uint8Array };

/** Trae y abre un pedazo. `null` es que ahí no hay relieve (mar abierto o fuera del archivo). */
export type LectorDePedazos = (z: number, x: number, y: number) => Promise<PedazoDeRelieve | null>;

/** Dónde cae un punto: qué pedazo y en qué lugar de él, con decimales. */
export function ubicarEnElRelieve(lon: number, lat: number, z: number, lado: number) {
  const cantidad = 2 ** z;
  const radianes = (lat * Math.PI) / 180;
  const columna = ((lon + 180) / 360) * cantidad;
  const fila = ((1 - Math.log(Math.tan(radianes) + 1 / Math.cos(radianes)) / Math.PI) / 2) * cantidad;
  const x = Math.min(cantidad - 1, Math.max(0, Math.floor(columna)));
  const y = Math.min(cantidad - 1, Math.max(0, Math.floor(fila)));
  return { x, y, px: (columna - x) * lado, py: (fila - y) * lado };
}

/** La altura que guarda un punto de la imagen, en metros. */
export function alturaTerrarium(rojo: number, verde: number, azul: number): number {
  return rojo * 256 + verde + azul / 256 - 32768;
}

/** Mezcla los cuatro puntos que rodean al pedido. Cerca del borde se usa el último punto del pedazo. */
export function alturaEnElPedazo(pedazo: PedazoDeRelieve, px: number, py: number): number {
  const leer = (cx: number, cy: number) => {
    const i = (cy * pedazo.ancho + cx) * pedazo.canales;
    return alturaTerrarium(pedazo.datos[i], pedazo.datos[i + 1], pedazo.datos[i + 2]);
  };
  // El valor de cada punto vale para su centro.
  const fx = Math.min(pedazo.ancho - 1, Math.max(0, px - 0.5));
  const fy = Math.min(pedazo.alto - 1, Math.max(0, py - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(pedazo.ancho - 1, x0 + 1);
  const y1 = Math.min(pedazo.alto - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const arriba = leer(x0, y0) * (1 - tx) + leer(x1, y0) * tx;
  const abajo = leer(x0, y1) * (1 - tx) + leer(x1, y1) * tx;
  return arriba * (1 - ty) + abajo * ty;
}

/** El lado de cada pedazo del relieve, en puntos. */
const LADO = 512;

/**
 * La altura de cada punto, en el mismo orden. Abre cada pedazo una sola vez
 * aunque caigan cien puntos en él.
 */
export async function alturasDePuntos(puntos: Position[], leerPedazo: LectorDePedazos): Promise<Resultado<number[]>> {
  const z = ACERCAMIENTO_MAXIMO_DEL_RELIEVE;
  const abiertos = new Map<string, Promise<PedazoDeRelieve | null>>();
  const alturas: number[] = [];
  try {
    for (const [lon, lat] of puntos) {
      const lugar = ubicarEnElRelieve(lon, lat, z, LADO);
      const clave = `${lugar.x}/${lugar.y}`;
      if (!abiertos.has(clave)) abiertos.set(clave, leerPedazo(z, lugar.x, lugar.y));
      const pedazo = await abiertos.get(clave)!;
      if (!pedazo) {
        return falla("Una parte de la línea cae donde no hay datos del terreno, así que no se pudieron calcular sus alturas. Revisá que la línea esté bien ubicada.");
      }
      // Si el pedazo vino de otro tamaño, el lugar se escala a ese tamaño.
      alturas.push(alturaEnElPedazo(pedazo, (lugar.px * pedazo.ancho) / LADO, (lugar.py * pedazo.alto) / LADO));
    }
  } catch (error) {
    const motivo = error instanceof Error && error.message ? error.message : "el servidor del relieve no contestó";
    return falla(`No se pudieron calcular las alturas: ${motivo}. No se guardó nada. Probá de nuevo en un rato.`);
  }
  return exito(alturas);
}
