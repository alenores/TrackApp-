import {
  borrarFotosQueSobran,
  cualesFotosEstanGuardadas,
  guardarFotos,
  type FotoGuardada,
} from "@/lib/anotaciones/deposito";
import type { Anotacion } from "@/types/database";

/**
 * Bajar al celular la foto chica de todas las anotaciones.
 *
 * **Baja sola, con las anotaciones, sin que nadie la pida.** Es la versión
 * pensada para la pantalla del celular: pesa unas veinte veces menos que la
 * grande, así que no hace falta que el usuario elija gastar datos en ella. La
 * grande nunca baja: se mira con internet en zonas y sectores.
 *
 * Antes las fotos bajaban pegadas al mapa del sector. Eso se descartó el
 * 2026-09-24: una anotación marcada desde la navegación puede caer fuera de
 * todo sector, y su foto no llegaba nunca al celular de nadie.
 *
 * **Una foto que falla no frena nada.** Se dice cuántas faltan y se reintenta
 * la próxima vez que la app se ponga al día con señal.
 */

export type AvanceDeFotos = {
  bajadas: number;
  total: number;
  /** Qué pasó con las que no entraron. `null` si entraron todas. */
  motivo: string | null;
  /** Todas las que quedaron en el celular, para poder revisarlo después. */
  direcciones: string[];
};

/** Cuántas fotos se piden a la vez. Pesan más que un pedazo de mapa. */
const A_LA_VEZ = 3;

/** Las direcciones de foto chica de estas anotaciones, sin repetir y sin vacías. */
export function fotosDeLasAnotaciones(anotaciones: Anotacion[]): string[] {
  const direcciones = new Set<string>();
  for (const anotacion of anotaciones) {
    if (anotacion.fotoChicaUrl) direcciones.add(anotacion.fotoChicaUrl);
  }
  return [...direcciones];
}

function motivoDe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudieron traer algunas fotos de las anotaciones.";
}

async function traerUna(direccion: string, senal: AbortSignal): Promise<FotoGuardada> {
  const respuesta = await fetch(direccion, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(
      `La foto de una anotación no se pudo bajar (respondió ${respuesta.status}).`,
    );
  }

  const bytes = new Uint8Array(await respuesta.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error("La foto de una anotación llegó vacía.");
  }

  return { direccion, bytes };
}

export type PedidoDeFotos = {
  anotaciones: Anotacion[];
  senal?: AbortSignal;
  avisarAvance?: (bajadas: number, total: number) => void;
};

/**
 * Baja las que falten y devuelve el estado real: cuántas hay en el celular de
 * las que este sector necesita, y qué pasó con las que no.
 */
export async function bajarLasFotosDeLasAnotaciones({
  anotaciones,
  senal = new AbortController().signal,
  avisarAvance,
}: PedidoDeFotos): Promise<AvanceDeFotos> {
  const todas = fotosDeLasAnotaciones(anotaciones);
  const total = todas.length;

  if (total === 0) {
    return { bajadas: 0, total: 0, motivo: null, direcciones: [] };
  }

  let yaEstaban: Set<string>;
  try {
    yaEstaban = await cualesFotosEstanGuardadas(todas);
  } catch (error) {
    return { bajadas: 0, total, motivo: motivoDe(error), direcciones: [] };
  }

  const faltan = todas.filter((direccion) => !yaEstaban.has(direccion));
  const entraron = new Set(yaEstaban);

  let siguiente = 0;
  let primerFallo: unknown = null;
  const avisar = () => avisarAvance?.(entraron.size, total);
  avisar();

  async function trabajar(): Promise<void> {
    for (;;) {
      if (senal.aborted) return;

      const indice = siguiente;
      siguiente += 1;
      if (indice >= faltan.length) return;

      try {
        const foto = await traerUna(faltan[indice], senal);
        // De a una: si se corta a la mitad, lo que entró queda y la próxima vez
        // no se vuelve a pagar en datos.
        await guardarFotos([foto]);
        entraron.add(foto.direccion);
        avisar();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        primerFallo ??= error;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(A_LA_VEZ, Math.max(faltan.length, 1)) }, trabajar),
  );

  // No se cree en la cuenta propia: se le pregunta al depósito qué quedó.
  let quedaron: Set<string>;
  try {
    quedaron = await cualesFotosEstanGuardadas(todas);
  } catch (error) {
    return {
      bajadas: entraron.size,
      total,
      motivo: motivoDe(error),
      direcciones: [...entraron],
    };
  }

  const faltaron = total - quedaron.size;

  return {
    bajadas: quedaron.size,
    total,
    motivo:
      faltaron > 0
        ? primerFallo
          ? motivoDe(primerFallo)
          : "Quedaron fotos de anotaciones sin bajar."
        : null,
    direcciones: [...quedaron],
  };
}

/**
 * Deja el celular con la foto chica de cada anotación, y nada más.
 *
 * Baja las que falten y tira las que ya no son de ninguna anotación: una foto
 * reemplazada o de una anotación borrada deja de ocupar lugar sola.
 *
 * **Solo se tira si la lista de anotaciones está completa**, que es lo que
 * garantiza la puesta al día del paquete antes de llamar acá. Con una lista a
 * medias se borrarían fotos que sí hacen falta.
 */
export async function ponerAlDiaLasFotosChicas(
  anotaciones: Anotacion[],
  senal?: AbortSignal,
): Promise<AvanceDeFotos> {
  const avance = await bajarLasFotosDeLasAnotaciones({ anotaciones, senal });

  try {
    await borrarFotosQueSobran(new Set(fotosDeLasAnotaciones(anotaciones)));
  } catch {
    // Espacio ocupado de gusto: se reintenta la próxima vez.
  }

  return avance;
}

/**
 * Cuántas fotos chicas faltan en el celular.
 *
 * **Se pregunta en casa, con señal**, para avisar antes de salir. Lee solo el
 * depósito del celular: no sale a internet.
 */
export async function cuantasFotosChicasFaltan(
  anotaciones: Anotacion[],
): Promise<number> {
  const necesita = fotosDeLasAnotaciones(anotaciones);
  if (necesita.length === 0) return 0;

  try {
    const estan = await cualesFotosEstanGuardadas(necesita);
    return necesita.length - estan.size;
  } catch {
    return necesita.length;
  }
}
