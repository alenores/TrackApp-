import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { traducirErrorDeBase } from "@/lib/datos/resultado";
import { COLUMNAS_DE_SALIDA, leerSalida, type FilaDeSalida } from "@/lib/salidas/fila";
import { traerTodasLasFilas, type ConsultaDeLista } from "@/lib/supabase/listas";
import type { Salida } from "@/types/database";

/**
 * Leer salidas. **Solo con internet, siempre desde la base.**
 *
 * Salidas no se guarda en el celular. La lista entera se trae una sola vez por
 * apertura y en el celular se busca, se filtra y se pasa de página sin volver
 * a preguntar (decisión 054). Va por tandas: la base corta en 1000 filas sin
 * avisar.
 */

/** Todas las salidas vivas, de la más nueva a la más vieja. */
export async function traerTodasLasSalidas(): Promise<
  { ok: true; salidas: Salida[] } | { ok: false; motivo: string }
> {
  const supabase = await crearClienteEnElServidor();
  const resultado = await traerTodasLasFilas<FilaDeSalida>((desde, hasta) =>
    supabase
      .from("salidas")
      .select(COLUMNAS_DE_SALIDA)
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta) as unknown as ConsultaDeLista<FilaDeSalida>,
  );
  if (!resultado.completa) {
    return { ok: false, motivo: `la lista quedó incompleta: ${traducirErrorDeBase(resultado.motivo)}` };
  }

  const salidas = resultado.filas.map(leerSalida);
  salidas.sort((a, b) => (a.fecha === b.fecha ? b.id - a.id : a.fecha < b.fecha ? 1 : -1));
  return { ok: true, salidas };
}
