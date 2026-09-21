/**
 * Cuando la app se actualizó mientras estaba abierta.
 *
 * **La versión nueva toma el mando al instante**, aunque haya una pantalla
 * vieja abierta. Esa pantalla, al pasar a otra por dentro de la app, pide sus
 * archivos viejos, que la versión nueva ya no tiene: el pedido falla y la
 * pantalla se rompe. Pasó el 2026-09-21 en el celular de Ale, al abrir la
 * navegación de una ruta con cinco versiones publicadas en el medio.
 *
 * **No es una pantalla rota: es una versión nueva.** Lo que corresponde es
 * recargar la página entera una vez, sin molestar. Solo si vuelve a fallar
 * enseguida se muestra el cartel, para no quedar recargando en un bucle.
 *
 * Sin señal esto no puede pasar: no hay versión nueva y nada se pide a
 * internet.
 */

/** Cómo avisa el navegador que un archivo de la app no está más. */
export function esUnArchivoDeLaAppQueYaNoExiste(error: { name?: string; message?: string }): boolean {
  if (error.name === "ChunkLoadError") return true;
  return /loading chunk .* failed/i.test(error.message ?? "");
}

const MARCA = "trackapp-recargado-por-version-nueva";

/** Cuánto tiene que pasar para volver a probar una recarga automática. */
const NO_ANTES_DE = 30 * 1000;

type Memoria = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Si conviene recargar ahora, lo anota y contesta que sí. Si ya se recargó
 * hace un momento por lo mismo, contesta que no: algo más está fallando.
 */
export function convieneRecargarPorVersionNueva(
  memoria: Memoria | null,
  ahora: number = Date.now(),
): boolean {
  if (!memoria) return false;

  try {
    const ultima = Number(memoria.getItem(MARCA) ?? 0);
    if (ultima && ahora - ultima < NO_ANTES_DE) return false;
    memoria.setItem(MARCA, String(ahora));
    return true;
  } catch {
    // Sin dónde anotar no se puede evitar el bucle: mejor mostrar el cartel.
    return false;
  }
}

/**
 * Qué hacer cuando la versión nueva acaba de tomar el mando.
 *
 * Copiado de Vías de Escalada, donde funciona desde julio de 2026:
 *
 * - **Solo si es una actualización.** La primera vez que se instala no hay
 *   nada viejo abierto, y recargar ahí interrumpía el login.
 * - **Nunca con la pantalla a la vista.** Se recarga cuando el usuario manda
 *   la app a segundo plano, que es imperceptible.
 * - **Nunca navegando una ruta.** Es regla de esta casa (decisión 012): nada
 *   se actualiza durante una navegación. Si la versión nueva llegó en el
 *   medio, se espera a que termine; la red de rescate cubre lo que falte.
 */
export type CuandoRecargar = "ahora" | "cuando-se-esconda" | "nunca";

export function cuandoRecargarPorVersionNueva(estado: {
  habiaVersionAntes: boolean;
  visible: boolean;
  navegando: boolean;
}): CuandoRecargar {
  if (!estado.habiaVersionAntes) return "nunca";
  if (estado.navegando) return "nunca";
  return estado.visible ? "cuando-se-esconda" : "ahora";
}

/** La pantalla de navegar una ruta, la única que no se puede interrumpir. */
export function esLaPantallaDeNavegar(camino: string): boolean {
  return camino.startsWith("/navegacion/");
}
