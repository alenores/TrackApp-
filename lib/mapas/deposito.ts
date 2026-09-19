import {
  ESTANTES,
  escribirEnElDeposito,
  leerDelDeposito,
} from "@/lib/offline/deposito";

/**
 * Dónde se guardan los pedazos de mapa en el celular.
 *
 * **Acá no existe la idea de sector.** Cada pedazo se guarda con su nombre de
 * grilla y nada más. Es a propósito: dos sectores vecinos comparten pedazos, y
 * sobre todo comparten **todos** los de los acercamientos lejanos, donde el
 * mundo entero entra en una sola tesela. Guardándolos por nombre de grilla, el
 * segundo sector que se baja ya encuentra hecha esa parte y no la vuelve a
 * bajar.
 *
 * La contracara es que **borrar el mapa de un sector no puede borrar sus
 * pedazos a ciegas**: puede haber otro sector que los siga necesitando. Por eso
 * el borrado se hace al revés —se dice qué pedazos siguen haciendo falta y se
 * va todo lo demás— y de eso se encarga `descarga.ts`, que es quien sabe de
 * sectores.
 *
 * Qué sector tiene mapa bajado se anota aparte, en el guardado liviano
 * (`lib/offline/mapas.ts`), porque las pantallas lo necesitan al instante.
 */

/** Los bytes de un pedazo de mapa. Vacío significa que ahí no hay nada que dibujar. */
export type TeselaGuardada = { clave: string; bytes: Uint8Array };

export async function guardarTeselas(teselas: TeselaGuardada[]): Promise<void> {
  await escribirEnElDeposito(
    ESTANTES.teselas,
    teselas.map(({ clave, bytes }) => (donde: IDBObjectStore) => donde.put(bytes, clave)),
  );
}

/**
 * Los bytes de un pedazo, o nada si no está bajado.
 *
 * **Nunca sale a internet.** Si no está, no está: el mapa dibuja el resto y la
 * pantalla ya avisó antes de salir qué sectores faltaban.
 */
export async function leerTesela(clave: string): Promise<Uint8Array | null> {
  try {
    const guardada = await leerDelDeposito<Uint8Array | undefined>(
      ESTANTES.teselas,
      (donde) => donde.get(clave),
    );
    return guardada ?? null;
  } catch {
    return null;
  }
}

/**
 * Cuáles de estos pedazos ya están en el celular.
 *
 * Sirve para dos cosas: no volver a bajar lo que ya está, y **comprobar al
 * final que lo que se pidió es lo que quedó**. Sin esa comprobación la app
 * diría «listo» sobre una descarga a la que le faltan pedazos.
 */
export async function cualesEstanGuardadas(claves: string[]): Promise<Set<string>> {
  const pedidas = new Set(claves);
  const guardadas = await leerDelDeposito<IDBValidKey[]>(ESTANTES.teselas, (donde) =>
    donde.getAllKeys(),
  );

  const encontradas = new Set<string>();
  for (const clave of guardadas) {
    if (typeof clave === "string" && pedidas.has(clave)) encontradas.add(clave);
  }
  return encontradas;
}

/**
 * Tira todo pedazo que ya no haga falta.
 *
 * **Lo que se descarga tiene que poder borrarse de verdad.** Se pasa la lista
 * de lo que sigue haciendo falta —la de todos los sectores que quedan con mapa—
 * y se va el resto. Así borrar un sector nunca se lleva puesto el mapa del
 * sector de al lado.
 */
export async function borrarTeselasQueSobran(
  clavesQueSiguenHaciendoFalta: Set<string>,
): Promise<void> {
  const guardadas = await leerDelDeposito<IDBValidKey[]>(ESTANTES.teselas, (donde) =>
    donde.getAllKeys(),
  );

  const sobran = guardadas.filter(
    (clave): clave is string =>
      typeof clave === "string" && !clavesQueSiguenHaciendoFalta.has(clave),
  );

  await escribirEnElDeposito(
    ESTANTES.teselas,
    sobran.map((clave) => (donde: IDBObjectStore) => donde.delete(clave)),
  );
}

export async function borrarTodasLasTeselas(): Promise<void> {
  await escribirEnElDeposito(ESTANTES.teselas, [(donde) => donde.clear()]);
}
