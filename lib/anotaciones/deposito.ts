import {
  ESTANTES,
  escribirEnElDeposito,
  leerDelDeposito,
} from "@/lib/offline/deposito";
import { FORMATO } from "@/lib/anotaciones/fotos";
import { esFotoPendiente } from "@/lib/anotaciones/pendientes";

/**
 * Dónde se guardan en el celular las fotos de las anotaciones.
 *
 * **Una foto que solo se ve con señal no sirve para nada.** La anotación con
 * foto existe justo para el momento en que la persona está parada en el cruce
 * sin saber por dónde seguir, y ahí no hay internet. Así que la foto se baja
 * antes, en casa, junto con el mapa del sector, y en el cerro se lee de acá.
 *
 * **Se guarda por dirección, no por número de anotación.** Cada vez que se
 * cambia la foto de una anotación, la dirección cambia también. Guardando por
 * dirección, una foto reemplazada se baja sola la próxima vez y la vieja queda
 * marcada como sobrante: no hace falta llevar la cuenta de qué versión hay.
 */

/** Los bytes de una foto, tal cual entraron. */
export type FotoGuardada = { direccion: string; bytes: Uint8Array };

export async function guardarFotos(fotos: FotoGuardada[]): Promise<void> {
  await escribirEnElDeposito(
    ESTANTES.fotosDeAnotacion,
    fotos.map(
      ({ direccion, bytes }) =>
        (donde: IDBObjectStore) =>
          donde.put(bytes, direccion),
    ),
  );
}

/**
 * La foto guardada, lista para mostrar, o nada si no está bajada.
 *
 * **Nunca sale a internet.** Si no está, no está, y la pantalla lo dice: el
 * usuario tiene que saber que esa foto quedó en casa, no quedarse mirando un
 * recuadro vacío.
 */
export async function leerFoto(direccion: string): Promise<Blob | null> {
  try {
    const guardada = await leerDelDeposito<Uint8Array | undefined>(
      ESTANTES.fotosDeAnotacion,
      (donde) => donde.get(direccion),
    );

    if (!guardada || guardada.byteLength === 0) return null;
    // Se copia: el original queda en el depósito y esta copia se la lleva la
    // pantalla.
    return new Blob([guardada.slice()], { type: FORMATO });
  } catch {
    return null;
  }
}

/** Cuáles de estas fotos ya están en el celular. */
export async function cualesFotosEstanGuardadas(
  direcciones: string[],
): Promise<Set<string>> {
  const pedidas = new Set(direcciones);
  const guardadas = await leerDelDeposito<IDBValidKey[]>(
    ESTANTES.fotosDeAnotacion,
    (donde) => donde.getAllKeys(),
  );

  const encontradas = new Set<string>();
  for (const direccion of guardadas) {
    if (typeof direccion === "string" && pedidas.has(direccion)) {
      encontradas.add(direccion);
    }
  }
  return encontradas;
}

/**
 * Tira toda foto que ya no haga falta.
 *
 * Mismo criterio que con los pedazos de mapa: se dice qué sigue haciendo falta
 * y se va el resto. Así sacar un sector no se lleva puesta la foto de una
 * anotación del sector de al lado, y una foto reemplazada deja de ocupar lugar.
 */
export async function borrarFotosQueSobran(
  direccionesQueSiguenHaciendoFalta: Set<string>,
): Promise<void> {
  const guardadas = await leerDelDeposito<IDBValidKey[]>(
    ESTANTES.fotosDeAnotacion,
    (donde) => donde.getAllKeys(),
  );

  // Las fotos de lo marcado sin señal no se tocan: todavía no subieron y no
  // están en ninguna lista de la base. Se van solas cuando el pendiente sube.
  const sobran = guardadas.filter(
    (direccion): direccion is string =>
      typeof direccion === "string" &&
      !esFotoPendiente(direccion) &&
      !direccionesQueSiguenHaciendoFalta.has(direccion),
  );

  await escribirEnElDeposito(
    ESTANTES.fotosDeAnotacion,
    sobran.map((direccion) => (donde: IDBObjectStore) => donde.delete(direccion)),
  );
}

export async function borrarTodasLasFotos(): Promise<void> {
  await escribirEnElDeposito(ESTANTES.fotosDeAnotacion, [(donde) => donde.clear()]);
}
