import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * La base devuelve como máximo 1000 filas por respuesta y no avisa: responde
 * bien, con la lista cortada. En Vías de Escalada eso dejó 202 vías invisibles
 * durante meses, sin un solo cartel.
 *
 * Por eso ninguna consulta de lista se hace a mano. O se usa `traerTodasLasFilas`,
 * que va por tandas y avisa si algo no cierra, o se pide un límite explícito.
 */

const TAMANO_TANDA = 1000;

export type ResultadoLista<T> =
  | { completa: true; filas: T[] }
  | { completa: false; filas: T[]; motivo: string };

type Consulta<T> = PostgrestFilterBuilder<never, never, T[], string, unknown>;

/**
 * Trae todas las filas de una consulta, por tandas.
 *
 * `construirConsulta` recibe el rango a pedir y devuelve la consulta ya
 * ordenada. **El orden tiene que terminar en una columna única** (`id`), si no
 * las tandas se pisan entre sí: se repiten y se saltean filas.
 *
 * Nunca lanza: si algo falla, devuelve lo que llegó y el motivo, para que la
 * pantalla pueda decir que la lista quedó incompleta en vez de mentir.
 */
export async function traerTodasLasFilas<T>(
  construirConsulta: (desde: number, hasta: number) => Consulta<T>,
  maximoDeTandas = 20,
): Promise<ResultadoLista<T>> {
  const filas: T[] = [];

  for (let tanda = 0; tanda < maximoDeTandas; tanda += 1) {
    const desde = tanda * TAMANO_TANDA;
    const hasta = desde + TAMANO_TANDA - 1;

    const { data, error } = await construirConsulta(desde, hasta);

    if (error) {
      return {
        completa: false,
        filas,
        motivo: error.message,
      };
    }

    const recibidas = (data ?? []) as T[];
    filas.push(...recibidas);

    if (recibidas.length < TAMANO_TANDA) {
      return { completa: true, filas };
    }
  }

  return {
    completa: false,
    filas,
    motivo: `La lista superó las ${maximoDeTandas} tandas de ${TAMANO_TANDA} filas.`,
  };
}
