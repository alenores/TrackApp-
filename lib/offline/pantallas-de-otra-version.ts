import {
  PANTALLAS_DE_ENTRADA,
  PANTALLAS_DE_ENTRADA_INTERNO,
  PANTALLAS_DEL_CERRO,
  PANTALLAS_DEL_CERRO_INTERNO,
} from "@/lib/offline/depositos";
import { SELLO_DE_VERSION } from "@/lib/sello-de-version";

/**
 * Las pantallas guardadas de otra versión de la app son basura, y se tiran.
 *
 * **Una pantalla guardada apunta al código de la versión con la que se
 * guardó.** Cuando sale una versión nueva, ese código deja de existir en el
 * servidor. Si la pantalla vieja se sirve igual —pasa cuando la red tarda más
 * de tres segundos, que en el cerro con una raya de señal es lo normal— la
 * app pide un archivo que ya no está y aparece «Esta pantalla se rompió». Lo
 * vio Ale el 2026-09-21, tres veces seguidas, con la versión nueva ya abajo.
 *
 * Y el calentador no lo arreglaba: **una pantalla que ya está guardada no se
 * vuelve a guardar**, sea de la versión que sea.
 *
 * Por eso, al arrancar con una versión distinta de la que dejó las pantallas,
 * se tiran todas. El calentador las vuelve a guardar solo, con señal, apenas
 * el paquete está al día; y sin señal no puede haber versión nueva, así que
 * nunca se tira lo que hace falta en el cerro. Es lo que Vías de Escalada
 * hace desde julio de 2026.
 */

const LLAVE = "trackapp-pantallas-de-la-version";

const DEPOSITOS_DE_PANTALLAS = [
  PANTALLAS_DE_ENTRADA,
  PANTALLAS_DE_ENTRADA_INTERNO,
  PANTALLAS_DEL_CERRO,
  PANTALLAS_DEL_CERRO_INTERNO,
  /** Donde cae toda pantalla sin regla propia. */
  "lo-demas",
];

type Memoria = Pick<Storage, "getItem" | "setItem">;

/** Puro, para poder probarlo: ¿las pantallas guardadas son de otra versión? */
export function lasPantallasSonDeOtraVersion(memoria: Memoria | null, version: string): boolean {
  if (!memoria) return false;
  try {
    const conLaQueSeGuardaron = memoria.getItem(LLAVE);
    // La primera vez no hay nada anotado: lo que haya guardado puede ser de
    // cualquier versión, y se trata igual que si fuera de otra.
    return conLaQueSeGuardaron !== version;
  } catch {
    return false;
  }
}

export function anotarLaVersionDeLasPantallas(memoria: Memoria | null, version: string): void {
  try {
    memoria?.setItem(LLAVE, version);
  } catch {
    // Sin dónde anotar, la próxima apertura vuelve a tirar. No es grave.
  }
}

/**
 * Tira las pantallas guardadas si son de otra versión. Devuelve si tiró.
 *
 * **Nunca tira** en el sentido de fallar: es trabajo de fondo.
 */
export async function tirarLasPantallasDeOtraVersion(): Promise<boolean> {
  if (typeof window === "undefined" || typeof caches === "undefined") return false;

  const memoria = window.localStorage;
  if (!lasPantallasSonDeOtraVersion(memoria, SELLO_DE_VERSION)) return false;

  await Promise.all(
    DEPOSITOS_DE_PANTALLAS.map((deposito) => caches.delete(deposito).catch(() => false)),
  );
  anotarLaVersionDeLasPantallas(memoria, SELLO_DE_VERSION);
  return true;
}
