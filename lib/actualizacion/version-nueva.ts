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

/** La dirección de la pieza que no se pudo traer, si el error la dice. */
export function direccionDelArchivoQueFalta(error: { message?: string }): string | null {
  // La dirección puede tener paréntesis adentro —las pantallas se llaman
  // «(app)»—: se toma hasta el último paréntesis del mensaje.
  const encontrada = /\(error: (\S+)\)\s*$/.exec(error.message ?? "");
  return encontrada ? encontrada[1] : null;
}

/**
 * Qué contesta internet cuando se le pregunta por la pieza que faltó.
 *
 * - `no_existe`: hay señal y la pieza ya no está. **Salió una versión nueva.**
 * - `existe`: hay señal y la pieza está. Fue un corte pasajero.
 * - `sin_respuesta`: no contestó. Sin señal —el caso del cerro— o muy lenta.
 */
export type RespuestaSobreElArchivo = "no_existe" | "existe" | "sin_respuesta";

/** Lo máximo que se espera la respuesta. Todo lo que tapa tiene tope. */
export const TOPE_DE_LA_CONSULTA_MS = 6000;

type Pedir = (direccion: string, opciones: RequestInit) => Promise<{ status: number }>;

/**
 * Pregunta a internet si la pieza existe.
 *
 * **Solo con esta respuesta se puede saber si hay una versión nueva.** Sin
 * señal, la pieza tampoco se puede traer y el error es el mismo; pero ahí las
 * pantallas guardadas son lo único que deja navegar, y no se pueden tirar.
 */
export async function preguntarPorElArchivo(
  direccion: string,
  pedir: Pedir = (url, opciones) => fetch(url, opciones),
  topeMs: number = TOPE_DE_LA_CONSULTA_MS,
): Promise<RespuestaSobreElArchivo> {
  const cancelador = new AbortController();
  const reloj = setTimeout(() => cancelador.abort(), topeMs);
  try {
    const respuesta = await pedir(direccion, {
      method: "HEAD",
      cache: "no-store",
      signal: cancelador.signal,
    });
    if (respuesta.status === 404 || respuesta.status === 410) return "no_existe";
    if (respuesta.status >= 200 && respuesta.status < 400) return "existe";
    return "sin_respuesta";
  } catch {
    return "sin_respuesta";
  } finally {
    clearTimeout(reloj);
  }
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

/**
 * Las pantallas del cerro que no se pueden interrumpir: navegar una ruta y el
 * mapa libre. Mientras están abiertas no se recarga la app ni se pone al día.
 */
export function esLaPantallaDeNavegar(camino: string): boolean {
  return camino.startsWith("/navegacion/") || /^\/mapa-libre\/?$/.test(camino);
}
