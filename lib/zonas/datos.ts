import { createClient } from "@/lib/supabase/server";
import {
  mapearResultado,
  traerTodasLasFilas,
  type ResultadoLista,
} from "@/lib/supabase/listas";
import {
  COLUMNAS_RECTANGULO,
  leerRectangulo,
  type ColumnasRectangulo,
} from "@/lib/datos/rectangulo";
import type { Zona } from "@/types/database";

/**
 * Acceso a la tabla de zonas.
 *
 * La zona tiene rectángulo propio, pero **nunca se descarga**: existe solo para
 * medir qué parte de su territorio todavía no tiene sector encima. La unidad de
 * descarga es el sector, siempre.
 */

type Fila = ColumnasRectangulo & {
  id: number;
  perfil_id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
  actualizado_en: string;
};

const COLUMNAS = `
  id, perfil_id, nombre, descripcion,
  ${COLUMNAS_RECTANGULO},
  creado_en, actualizado_en
`;

function leer(fila: Fila): Zona {
  return {
    id: fila.id,
    perfilId: fila.perfil_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    rectangulo: leerRectangulo(fila),
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function traerZonas(): Promise<ResultadoLista<Zona>> {
  const supabase = await createClient();

  const resultado = await traerTodasLasFilas<Fila>((desde, hasta) =>
    supabase
      .from("zonas")
      .select(COLUMNAS)
      .is("eliminado_en", null)
      .order("nombre", { ascending: true })
      .order("id", { ascending: true })
      .range(desde, hasta),
  );

  return mapearResultado(resultado, leer);
}

export async function traerZona(id: number): Promise<Zona | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zonas")
    .select(COLUMNAS)
    .eq("id", id)
    .is("eliminado_en", null)
    .maybeSingle();

  if (error || !data) return null;

  return leer(data as unknown as Fila);
}
