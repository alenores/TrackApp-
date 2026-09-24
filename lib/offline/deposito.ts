/**
 * El depósito grande del navegador.
 *
 * **Una sola base para todo lo pesado del celular**: las líneas de los
 * recorridos, los pedazos de mapa y las fotos de las anotaciones. Están juntas
 * a propósito. El navegador numera cada base por versión y se niega a abrir una
 * versión vieja: si cada módulo abriera la suya con su propio número, el día
 * que uno agregue un estante el otro deja de abrir y la app se queda sin nada
 * guardado, sin un solo cartel.
 *
 * Acá vive **toda** la conversación con el depósito. Ningún otro archivo llama
 * a `indexedDB` por su cuenta.
 *
 * Lo liviano —los datos de rutas, zonas, sectores y anotaciones— no va acá sino
 * en el guardado simple (`paquete.ts`), que dibuja las pantallas al instante.
 */

const NOMBRE = "trackapp-offline";

/**
 * Sube de número cada vez que se agrega un estante.
 *
 * La 1 tenía solo los recorridos. La 2 sumó los pedazos de mapa. La 3 sumó las
 * fotos de las anotaciones. La 4 suma las anotaciones marcadas sin señal que
 * esperan para subirse.
 */
const VERSION = 4;

export const ESTANTES = {
  recorridos: "recorridos",
  teselas: "teselas",
  mapasDeSector: "mapas-de-sector",
  fotosDeAnotacion: "fotos-de-anotacion",
  anotacionesPendientes: "anotaciones-pendientes",
} as const;

export type Estante = (typeof ESTANTES)[keyof typeof ESTANTES];

/**
 * La conexión abierta, guardada.
 *
 * Abrir el depósito cuesta milisegundos. Leer una línea de ruta pasa una vez
 * por pantalla y no se nota; leer un pedazo de mapa pasa **cientos de veces por
 * segundo** mientras el usuario arrastra el mapa. Sin esto, el mapa se arrastra
 * a los saltos.
 */
let conexion: Promise<IDBDatabase> | null = null;

function olvidar(intento: Promise<IDBDatabase>): void {
  if (conexion === intento) conexion = null;
}

function abrir(): Promise<IDBDatabase> {
  if (conexion) return conexion;

  const intento = new Promise<IDBDatabase>((resolver, rechazar) => {
    if (typeof indexedDB === "undefined") {
      rechazar(new Error("Este navegador no puede guardar cosas para usarlas sin señal."));
      return;
    }

    const pedido = indexedDB.open(NOMBRE, VERSION);

    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      for (const estante of Object.values(ESTANTES)) {
        if (!base.objectStoreNames.contains(estante)) base.createObjectStore(estante);
      }
    };

    pedido.onsuccess = () => {
      const base = pedido.result;
      // Si otra pestaña actualiza la versión, esta conexión queda vieja: se
      // suelta y la próxima lectura abre de nuevo, en vez de fallar para siempre.
      base.onversionchange = () => {
        base.close();
        olvidar(intento);
      };
      base.onclose = () => olvidar(intento);
      resolver(base);
    };

    pedido.onerror = () =>
      rechazar(pedido.error ?? new Error("No se pudo abrir el depósito del celular."));
    pedido.onblocked = () =>
      rechazar(new Error("Hay otra pestaña de TrackApp abierta con una versión vieja. Cerrala y volvé a entrar."));
  });

  conexion = intento;
  intento.catch(() => olvidar(intento));
  return intento;
}

export async function leerDelDeposito<T>(
  estante: Estante,
  operacion: (donde: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const base = await abrir();
  return new Promise<T>((resolver, rechazar) => {
    const transaccion = base.transaction(estante, "readonly");
    const pedido = operacion(transaccion.objectStore(estante));
    pedido.onsuccess = () => resolver(pedido.result);
    transaccion.onerror = () =>
      rechazar(transaccion.error ?? new Error("No se pudo leer del depósito del celular."));
    transaccion.onabort = () =>
      rechazar(transaccion.error ?? new Error("Se cortó la lectura del depósito del celular."));
  });
}

/**
 * Escribir varias cosas de una sola vez.
 *
 * **Termina recién cuando el navegador confirmó que quedó grabado**, no cuando
 * aceptó el pedido. Sin esa distinción la app diría «listo» sobre una descarga
 * que todavía está a mitad de camino, que es justo lo que no puede pasar.
 */
export async function escribirEnElDeposito(
  estante: Estante,
  operaciones: Array<(donde: IDBObjectStore) => IDBRequest>,
): Promise<void> {
  if (operaciones.length === 0) return;

  const base = await abrir();
  return new Promise<void>((resolver, rechazar) => {
    const transaccion = base.transaction(estante, "readwrite");
    const donde = transaccion.objectStore(estante);
    for (const operacion of operaciones) operacion(donde);

    transaccion.oncomplete = () => resolver();
    transaccion.onerror = () =>
      rechazar(transaccion.error ?? new Error("No se pudo guardar en el celular."));
    transaccion.onabort = () =>
      rechazar(transaccion.error ?? new Error("No entró en el celular: puede que no haya más espacio."));
  });
}

export function cerrarElDeposito(): void {
  const abierta = conexion;
  if (!abierta) return;
  conexion = null;
  abierta.then((base) => base.close()).catch(() => {});
}
