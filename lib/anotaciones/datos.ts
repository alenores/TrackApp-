import type { LineString, Point } from "geojson";
import { createClient } from "@/lib/supabase/server";
import {
  mapearResultado,
  traerTodasLasFilas,
  type ResultadoLista,
} from "@/lib/supabase/listas";
import type { Anotacion, IconoPunto, TipoAnotacion } from "@/types/database";

/**
 * Acceso a la tabla de anotaciones.
 *
 * Las anotaciones pertenecen al territorio, no a la ruta: el árbol gigante es
 * el árbol gigante, pase la ruta que pase. Se descargan con el sector.
 */

type Fila = {
  id: number;
  sector_id: number;
  perfil_id: string;
  tipo: TipoAnotacion;
  icono: IconoPunto | null;
  color: string | null;
  comentario: string | null;
  geometria: Point | LineString;
  creado_en: string;
  actualizado_en: string;
};

const COLUMNAS = `
  id, sector_id, perfil_id, tipo, icono, color, comentario, geometria,
  creado_en, actualizado_en
`;

function leer(fila: Fila): Anotacion {
  return {
    id: fila.id,
    sectorId: fila.sector_id,
    perfilId: fila.perfil_id,
    tipo: fila.tipo,
    icono: fila.icono,
    color: fila.color,
    comentario: fila.comentario,
    geometria: fila.geometria,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function traerAnotacionesDeSector(
  sectorId: number,
): Promise<ResultadoLista<Anotacion>> {
  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<Fila>((desde, hasta) =>
    supabase
      .from("anotaciones")
      .select(COLUMNAS)
      .eq("sector_id", sectorId)
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  return mapearResultado(resultado, leer);
}

/** Las anotaciones de varios sectores, para armar el paquete de una descarga. */
export async function traerAnotacionesDeSectores(
  sectorIds: number[],
): Promise<ResultadoLista<Anotacion>> {
  if (sectorIds.length === 0) return { completa: true, filas: [] };

  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<Fila>((desde, hasta) =>
    supabase
      .from("anotaciones")
      .select(COLUMNAS)
      .in("sector_id", sectorIds)
      .is("eliminado_en", null)
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  return mapearResultado(resultado, leer);
}
