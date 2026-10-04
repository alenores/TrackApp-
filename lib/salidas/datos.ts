import { crearClienteEnElServidor } from "@/lib/supabase/servidor";
import { traducirErrorDeBase } from "@/lib/datos/resultado";
import { COLUMNAS_DE_SALIDA, leerSalida, type FilaDeSalida } from "@/lib/salidas/fila";
import { SIN_FILTROS, tituloParaBuscar, type FiltrosDeSalidas } from "@/lib/salidas/filtros";
import { traerTodasLasFilas } from "@/lib/supabase/listas";
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

/**
 * Los días que tuvieron salidas entre dos fechas, para marcarlos en el
 * calendario. Se pide de a un mes: en un mes no hay mil salidas, y el tope
 * explícito igual lo dice si pasara.
 */
export async function traerDiasConSalidas(
  desde: string,
  hasta: string,
): Promise<{ ok: true; dias: string[] } | { ok: false; motivo: string }> {
  const TOPE = 1000;
  const supabase = await crearClienteEnElServidor();
  const { data, error } = await supabase
    .from("salidas")
    .select("fecha")
    .is("eliminado_en", null)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .limit(TOPE);

  if (error) return { ok: false, motivo: traducirErrorDeBase(error.message) };
  const filas = (data ?? []) as { fecha: string }[];
  if (filas.length === TOPE) {
    return { ok: false, motivo: "hay demasiadas salidas en este mes para marcarlas todas" };
  }
  return { ok: true, dias: [...new Set(filas.map((fila) => fila.fecha))] };
}

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

/**
 * Una página de salidas, con los filtros puestos. Los filtros los resuelve la
 * base: así valen para todas las salidas y no solo para las de esta página.
 */
export async function traerSalidas(
  pagina: number,
  filtros: FiltrosDeSalidas = SIN_FILTROS,
): Promise<PaginaDeSalidas> {
  const supabase = await crearClienteEnElServidor();
  const desde = (pagina - 1) * SALIDAS_POR_PAGINA;

  let consulta = supabase.from("salidas").select(COLUMNAS_DE_SALIDA).is("eliminado_en", null);

  if (filtros.titulo.trim()) consulta = consulta.ilike("titulo", `%${tituloParaBuscar(filtros.titulo)}%`);
  if (filtros.actividades.length) consulta = consulta.overlaps("actividades", filtros.actividades);
  if (filtros.esfuerzos.length) consulta = consulta.in("nivel_esfuerzo", filtros.esfuerzos);
  if (filtros.desde) consulta = consulta.gte("fecha", filtros.desde);
  if (filtros.hasta) consulta = consulta.lte("fecha", filtros.hasta);

  if (filtros.participantes.length) {
    // Fue quien la cargó, o fue como compañero. Las de compañero se buscan
    // aparte, por tandas: la base corta en 1000 filas sin avisar.
    const comoCompanero = await traerTodasLasFilas<{ salida_id: number }>((inicio, fin) =>
      supabase
        .from("salidas_companeros")
        .select("salida_id")
        .in("perfil_id", filtros.participantes)
        .is("eliminado_en", null)
        .order("id", { ascending: true })
        .range(inicio, fin),
    );
    if (!comoCompanero.completa) {
      return {
        ok: false,
        motivo: `no se pudo buscar con quién fue cada salida: ${traducirErrorDeBase(comoCompanero.motivo)}`,
      };
    }
    const ids = [...new Set(comoCompanero.filas.map((fila) => fila.salida_id))];
    const deQuienLaCargo = `perfil_id.in.(${filtros.participantes.join(",")})`;
    consulta = consulta.or(ids.length ? `${deQuienLaCargo},id.in.(${ids.join(",")})` : deQuienLaCargo);
  }

  // Se pide una de más solo para saber si hay otra página.
  const { data, error } = await consulta
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
