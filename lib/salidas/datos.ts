import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { traducirErrorDeBase } from "@/lib/datos/resultado";
import { COLUMNAS_DE_SALIDA, leerSalida, type FilaDeSalida } from "@/lib/salidas/fila";
import type { Salida } from "@/types/database";

/**
 * Leer salidas. **Solo con internet, siempre desde la base.**
 *
 * Salidas no se guarda en el celular: la lista se arma cada vez que se abre la
 * pantalla, con señal.
 *
 * Se trae de a una página con tope explícito: la base corta en 1000 filas sin
 * avisar, y una lista de salidas no necesita más de una página por vez.
 */

export const SALIDAS_POR_PAGINA = 20;

export type PaginaDeSalidas =
  | { ok: true; salidas: Salida[]; pagina: number; hayMas: boolean }
  | { ok: false; motivo: string };

/** La página que pidió el usuario, o la primera si lo que llegó no se entiende. */
export function leerPagina(valor: string | string[] | undefined): number {
  const numero = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

export type UnaSalida =
  | { ok: true; salida: Salida }
  | { ok: false; noExiste: true }
  | { ok: false; noExiste: false; motivo: string };

/** El mensaje de cuando falló la base al traer una salida. */
export function mensajeDeFalla(motivo: string): string {
  return `No se pudo traer la salida: ${motivo} Volvé a intentar en un rato.`;
}

/** Una salida viva, para su ficha o para editarla. */
export async function traerSalida(salidaId: number): Promise<UnaSalida> {
  if (!Number.isInteger(salidaId) || salidaId < 1) return { ok: false, noExiste: true };

  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("salidas")
    .select(COLUMNAS_DE_SALIDA)
    .eq("id", salidaId)
    .is("eliminado_en", null)
    .maybeSingle();

  if (error) return { ok: false, noExiste: false, motivo: traducirErrorDeBase(error.message) };
  if (!data) return { ok: false, noExiste: true };

  return { ok: true, salida: leerSalida(data as unknown as FilaDeSalida) };
}

export async function traerSalidas(pagina: number): Promise<PaginaDeSalidas> {
  const supabase = await crearClienteEnElServidor();
  const desde = (pagina - 1) * SALIDAS_POR_PAGINA;

  // Se pide una de más solo para saber si hay otra página.
  const { data, error } = await supabase
    .from("salidas")
    .select(COLUMNAS_DE_SALIDA)
    .is("eliminado_en", null)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .range(desde, desde + SALIDAS_POR_PAGINA);

  if (error) {
    return { ok: false, motivo: traducirErrorDeBase(error.message) };
  }

  const filas = (data ?? []) as unknown as FilaDeSalida[];

  return {
    ok: true,
    salidas: filas.slice(0, SALIDAS_POR_PAGINA).map(leerSalida),
    pagina,
    hayMas: filas.length > SALIDAS_POR_PAGINA,
  };
}
