import type { FeatureCollection } from "geojson";
import {
  ESTANTES,
  escribirEnElDeposito,
  leerDelDeposito,
} from "@/lib/offline/deposito";

/**
 * Las líneas de las rutas, guardadas aparte del resto del paquete.
 *
 * **Por qué aparte.** La navegación es 100% sin conexión, así que la línea del
 * recorrido tiene que estar en el celular sí o sí. Pero una línea grabada por
 * un reloj trae miles de puntos y pesa cientos de kilobytes; cincuenta rutas se
 * comen el espacio que el navegador da para el guardado simple, y ahí la app
 * deja de poder guardar **nada**.
 *
 * Por eso el guardado simple se reserva para lo liviano —los datos de las
 * rutas, las zonas, los sectores y las anotaciones, que dibujan las pantallas al
 * instante— y las líneas van al depósito grande del navegador (`deposito.ts`),
 * que aguanta mucho más.
 */

export async function guardarRecorrido(
  rutaId: number,
  recorrido: FeatureCollection,
): Promise<boolean> {
  try {
    await escribirEnElDeposito(ESTANTES.recorridos, [
      (donde) => donde.put(recorrido, rutaId),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function leerRecorrido(
  rutaId: number,
): Promise<FeatureCollection | null> {
  try {
    const guardado = await leerDelDeposito<FeatureCollection | undefined>(
      ESTANTES.recorridos,
      (donde) => donde.get(rutaId),
    );
    return guardado ?? null;
  } catch {
    return null;
  }
}

/**
 * Saca del celular las líneas de rutas que ya no existen.
 *
 * Lo que se descarga tiene que poder borrarse de verdad: sin esto el depósito
 * crece para siempre y nunca baja, que es el problema que tenía la versión
 * anterior con los mapas.
 */
export async function borrarRecorridosQueSobran(
  rutasQueSiguenExistiendo: number[],
): Promise<void> {
  try {
    const vigentes = new Set(rutasQueSiguenExistiendo);
    const guardadas = await leerDelDeposito<IDBValidKey[]>(
      ESTANTES.recorridos,
      (donde) => donde.getAllKeys(),
    );

    const sobran = guardadas.filter(
      (clave): clave is number => typeof clave === "number" && !vigentes.has(clave),
    );

    await escribirEnElDeposito(
      ESTANTES.recorridos,
      sobran.map((clave) => (donde: IDBObjectStore) => donde.delete(clave)),
    );
  } catch {
    // Si no se puede limpiar, queda de más. Molesta, pero no rompe nada.
  }
}

export async function borrarTodosLosRecorridos(): Promise<void> {
  try {
    await escribirEnElDeposito(ESTANTES.recorridos, [(donde) => donde.clear()]);
  } catch {
    // Ídem.
  }
}
