import {
  cualesFotosEstanGuardadas,
  guardarFotos,
  type FotoGuardada,
} from "@/lib/anotaciones/deposito";
import type { MapaDeSector } from "@/lib/offline/mapas";
import type { Anotacion, Sector } from "@/types/database";

/**
 * Bajar al celular las fotos de las anotaciones de un sector.
 *
 * Van pegadas a la descarga del mapa del sector porque **pesan**, y lo que pesa
 * lo elige el usuario: los datos de las anotaciones —el ícono, el comentario,
 * las coordenadas— viajan siempre con el paquete, pero la foto no.
 *
 * **Una foto que falla no arruina el mapa.** El mapa es una promesa: sector en
 * verde quiere decir que se puede navegar con fondo. La foto es un extra, y si
 * una no entró, se dice cuántas faltan y se ofrece reintentar, que es un toque.
 * Trabar el mapa entero porque una foto quedó colgada sería cambiar un problema
 * chico por uno grave.
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

/** Las direcciones de foto de estas anotaciones, sin repetir y sin vacías. */
export function fotosDeLasAnotaciones(anotaciones: Anotacion[]): string[] {
  const direcciones = new Set<string>();
  for (const anotacion of anotaciones) {
    if (anotacion.fotoUrl) direcciones.add(anotacion.fotoUrl);
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

/** Un sector que tiene el mapa bajado pero le falta alguna foto. */
export type SectorConFotosSinBajar = { sector: Sector; cuantas: number };

/**
 * Qué sectores ya bajados tienen fotos de anotación sin bajar.
 *
 * **Esto se pregunta en casa, con señal.** Una foto agregada después de bajar
 * el mapa no está en el celular, y sin este aviso el usuario se enteraría
 * parado en el cruce, que es justo el lugar donde no se puede hacer nada.
 *
 * Los sectores **sin** mapa bajado no aparecen acá: para esos el aviso ya es
 * otro y más grande, que les falta el mapa.
 */
export function sectoresConFotosSinBajar(
  sectores: Sector[],
  anotaciones: Anotacion[],
  mapas: MapaDeSector[],
): SectorConFotosSinBajar[] {
  const porSector = new Map(mapas.map((mapa) => [mapa.sectorId, new Set(mapa.fotos)]));

  return sectores.flatMap((sector) => {
    const bajadas = porSector.get(sector.id);
    if (!bajadas) return [];

    const necesita = fotosDeLasAnotaciones(
      anotaciones.filter((cada) => cada.sectorId === sector.id),
    );
    const cuantas = necesita.filter((direccion) => !bajadas.has(direccion)).length;

    return cuantas > 0 ? [{ sector, cuantas }] : [];
  });
}
