import { createClient } from "@/lib/supabase/server";
import { parseRutaRow } from "@/lib/rutas/helpers";
import type { Ruta } from "@/types/database";

export async function fetchAllRutas(): Promise<Ruta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rutas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => parseRutaRow(row as Record<string, unknown>));
}
