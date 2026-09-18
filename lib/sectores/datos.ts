import { createClient } from "@/lib/supabase/server";
import { traerTodasLasFilas, type ResultadoLista } from "@/lib/supabase/listas";
import {
  COLUMNAS_RECTANGULO,
  leerRectangulo,
  type ColumnasRectangulo,
} from "@/lib/datos/rectangulo";
import type { Sector } from "@/types/database";

/**
 * Acceso a la tabla de sectores.
 *
 * El sector es la unidad que se descarga: un rectángulo alineado al norte
 * definido por dos puntos.
 */

type Fila = ColumnasRectangulo & {
  id: number;
  zona_id: number;
  perfil_id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
};

const COLUMNAS = `
  id, zona_id, perfil_id, nombre, descripcion,
  ${COLUMNAS_RECTANGULO},
  creado_en, actualizado_en
`;

function leer(fila: Fila): Sector {
  return {
    id: fila.id,
    zonaId: fila.zona_id,
    perfilId: fila.perfil_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    rectangulo: leerRectangulo(fila),
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

/** Todos los sectores. La app los necesita enteros para calcular cobertura. */
export async function traerSectores(): Promise<ResultadoLista<Sector>> {
  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<Fila>((desde, hasta) =>
    supabase
      .from("sectores")
      .select(COLUMNAS)
      .is("eliminado_en", null)
      .order("nombre", { ascending: true })
      .order("id", { ascending: true })
      .range(desde, hasta) as never,
  );

  const sectores = resultado.filas.map(leer);

  return resultado.completa
    ? { completa: true, filas: sectores }
    : { completa: false, filas: sectores, motivo: resultado.motivo };
}

export async function traerSectoresDeZona(
  zonaId: number,
): Promise<ResultadoLista<Sector>> {
  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<Fila>((desde, hasta) =>
    supabase
      .from("sectores")
      .select(COLUMNAS)
      .eq("zona_id", zonaId)
      .is("eliminado_en", null)
      .order("nombre", { ascending: true })
      .order("id", { ascending: true })
      .range(desde, hasta) as never,
  );

  const sectores = resultado.filas.map(leer);

  return resultado.completa
    ? { completa: true, filas: sectores }
    : { completa: false, filas: sectores, motivo: resultado.motivo };
}

export async function traerSector(id: number): Promise<Sector | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sectores")
    .select(COLUMNAS)
    .eq("id", id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (error || !data) return null;

  return leer(data as unknown as Fila);
}
