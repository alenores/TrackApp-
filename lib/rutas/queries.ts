import { createClient } from "@/lib/supabase/server";
import { parseRutaListItem, parseRutaRow } from "@/lib/rutas/helpers";
import type { Ruta, RutaListItem } from "@/types/database";

const RUTA_LIST_COLUMNS_WITH_AUTHOR =
  "id, nombre, descripcion, distancia_km, user_id, subido_por_nombre, created_at, actividades";

const RUTA_LIST_COLUMNS_BASE =
  "id, nombre, descripcion, distancia_km, user_id, created_at, actividades";

export async function fetchRutasList(): Promise<RutaListItem[]> {
  const supabase = await createClient();

  const primary = await supabase
    .from("rutas")
    .select(RUTA_LIST_COLUMNS_WITH_AUTHOR)
    .order("created_at", { ascending: false });

  let rows: Record<string, unknown>[] | null = primary.data as
    | Record<string, unknown>[]
    | null;

  if (primary.error) {
    const fallback = await supabase
      .from("rutas")
      .select(RUTA_LIST_COLUMNS_BASE)
      .order("created_at", { ascending: false });

    if (fallback.error || !fallback.data) {
      return [];
    }

    rows = fallback.data as Record<string, unknown>[];
  }

  if (!rows) {
    return [];
  }

  return rows.map((row) => parseRutaListItem(row));
}

export async function fetchRutaById(id: string): Promise<Ruta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rutas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseRutaRow(data as Record<string, unknown>);
}
