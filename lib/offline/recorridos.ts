import type { FeatureCollection } from "geojson";

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
 * instante— y las líneas van al depósito grande del navegador, que aguanta
 * mucho más.
 */

const DEPOSITO = "trackapp-offline";
const VERSION = 1;
const ESTANTE = "recorridos";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    if (typeof indexedDB === "undefined") {
      rechazar(new Error("Este navegador no puede guardar recorridos."));
      return;
    }

    const pedido = indexedDB.open(DEPOSITO, VERSION);

    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      if (!base.objectStoreNames.contains(ESTANTE)) {
        base.createObjectStore(ESTANTE);
      }
    };

    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () =>
      rechazar(pedido.error ?? new Error("No se pudo abrir el depósito."));
  });
}

function usar<T>(
  modo: IDBTransactionMode,
  operacion: (estante: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return abrir().then(
    (base) =>
      new Promise<T>((resolver, rechazar) => {
        const transaccion = base.transaction(ESTANTE, modo);
        const pedido = operacion(transaccion.objectStore(ESTANTE));

        pedido.onsuccess = () => resolver(pedido.result);
        transaccion.onerror = () =>
          rechazar(transaccion.error ?? new Error("Falló el guardado."));
      }),
  );
}

export async function guardarRecorrido(
  rutaId: number,
  recorrido: FeatureCollection,
): Promise<boolean> {
  try {
    await usar("readwrite", (estante) => estante.put(recorrido, rutaId));
    return true;
  } catch {
    return false;
  }
}

export async function leerRecorrido(
  rutaId: number,
): Promise<FeatureCollection | null> {
  try {
    const guardado = await usar<FeatureCollection | undefined>(
      "readonly",
      (estante) => estante.get(rutaId),
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
    const guardadas = await usar<IDBValidKey[]>("readonly", (estante) =>
      estante.getAllKeys(),
    );

    for (const clave of guardadas) {
      if (typeof clave === "number" && !vigentes.has(clave)) {
        await usar("readwrite", (estante) => estante.delete(clave));
      }
    }
  } catch {
    // Si no se puede limpiar, queda de más. Molesta, pero no rompe nada.
  }
}

export async function borrarTodosLosRecorridos(): Promise<void> {
  try {
    await usar("readwrite", (estante) => estante.clear());
  } catch {
    // Ídem.
  }
}
