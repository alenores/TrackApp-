import { createClient } from "@/lib/supabase/server";
import { parseRutaListItem, parseRutaRow } from "@/lib/rutas/helpers";
import type { Ruta, RutaListItem } from "@/types/database";

const RUTA_LIST_COLUMNS =
  "id, nombre, descripcion, distancia_km, user_id, subido_por_nombre, created_at";

export async function fetchRutasList(): Promise<RutaListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rutas")
    .select(RUTA_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => parseRutaListItem(row as Record<string, unknown>));
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
