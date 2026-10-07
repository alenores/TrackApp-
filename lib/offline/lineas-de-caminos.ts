import type { Position } from "geojson";
import type { CaminoGuardado, CaminoSinLinea } from "@/lib/caminos/datos";
import { ESTANTES, escribirEnElDeposito, leerDelDeposito } from "@/lib/offline/deposito";

/** La fecha forma parte de la clave: una actualización incompleta no pisa la línea anterior. */
export function claveDeLineaDeCamino(camino: Pick<CaminoSinLinea, "id" | "actualizadoEn">): string {
  return `${camino.id}:${camino.actualizadoEn}`;
}

/** Se guarda toda la tanda en una sola transacción antes de publicar el paquete nuevo. */
export async function guardarLineasDeCaminos(caminos: CaminoGuardado[]): Promise<boolean> {
  try {
    await escribirEnElDeposito(
      ESTANTES.lineasDeCaminos,
      caminos.map((camino) => (donde) => donde.put(camino.coordenadas, claveDeLineaDeCamino(camino))),
    );
    return true;
  } catch {
    return false;
  }
}

export async function leerLineaDeCamino(camino: CaminoSinLinea): Promise<Position[] | null> {
  try {
    const linea = await leerDelDeposito<Position[] | undefined>(
      ESTANTES.lineasDeCaminos,
      (donde) => donde.get(claveDeLineaDeCamino(camino)),
    );
    return linea ?? null;
  } catch {
    return null;
  }
}

/** Se llama solo después de que el paquete nuevo quedó guardado. */
export async function borrarLineasDeCaminosQueSobran(caminosVigentes: CaminoSinLinea[]): Promise<void> {
  try {
    const vigentes = new Set(caminosVigentes.map(claveDeLineaDeCamino));
    const claves = await leerDelDeposito<IDBValidKey[]>(ESTANTES.lineasDeCaminos, (donde) => donde.getAllKeys());
    const sobrantes = claves.filter((clave): clave is string => typeof clave === "string" && !vigentes.has(clave));
    await escribirEnElDeposito(
      ESTANTES.lineasDeCaminos,
      sobrantes.map((clave) => (donde) => donde.delete(clave)),
    );
  } catch {
    // Dejar líneas viejas ocupa espacio, pero nunca impide leer las actuales.
  }
}
