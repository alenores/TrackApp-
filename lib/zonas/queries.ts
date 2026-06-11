import { createClient } from "@/lib/supabase/server";
import { parseZonaListItem, parseSectorListItem } from "@/lib/zonas/labels";
import type { Zona, ZonaListItem, Sector, SectorListItem } from "@/types/database";

const ZONA_COLUMNS_WITH_AUTHOR =
  "id, user_id, provincia, nombre, descripcion, subido_por_nombre, created_at";

const ZONA_COLUMNS_BASE =
  "id, user_id, provincia, nombre, descripcion, created_at";

const SECTOR_COLUMNS_WITH_AUTHOR =
  "id, zona_id, user_id, nombre, descripcion, lat_ne, lon_ne, lat_se, lon_se, lat_so, lon_so, lat_no, lon_no, zoom_minimo, subido_por_nombre, created_at";

const SECTOR_COLUMNS_BASE =
  "id, zona_id, user_id, nombre, descripcion, lat_ne, lon_ne, lat_se, lon_se, lat_so, lon_so, lat_no, lon_no, zoom_minimo, created_at";

export async function fetchZonasList(): Promise<ZonaListItem[]> {
  try {
    const supabase = await createClient();

    const primary = await supabase
      .from("zonas")
      .select(ZONA_COLUMNS_WITH_AUTHOR)
      .order("provincia", { ascending: true })
      .order("nombre", { ascending: true });

    let rows: Record<string, unknown>[] | null = primary.data as
      | Record<string, unknown>[]
      | null;

    if (primary.error) {
      const fallback = await supabase
        .from("zonas")
        .select(ZONA_COLUMNS_BASE)
        .order("provincia", { ascending: true })
        .order("nombre", { ascending: true });

      if (fallback.error || !fallback.data) return [];
      rows = fallback.data as Record<string, unknown>[];
    }

    if (!rows) return [];
    return rows.map((row) => parseZonaListItem(row));
  } catch {
    return [];
  }
}

export async function fetchZonaById(id: string): Promise<Zona | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zonas")
    .select(ZONA_COLUMNS_WITH_AUTHOR)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return parseZonaListItem(data as Record<string, unknown>);
}

export async function fetchSectoresByZonaId(
  zonaId: string,
): Promise<SectorListItem[]> {
  const supabase = await createClient();

  const primary = await supabase
    .from("sectores")
    .select(SECTOR_COLUMNS_WITH_AUTHOR)
    .eq("zona_id", zonaId)
    .order("nombre", { ascending: true });

  let rows: Record<string, unknown>[] | null = primary.data as
    | Record<string, unknown>[]
    | null;

  if (primary.error) {
    const fallback = await supabase
      .from("sectores")
      .select(SECTOR_COLUMNS_BASE)
      .eq("zona_id", zonaId)
      .order("nombre", { ascending: true });

    if (fallback.error || !fallback.data) return [];
    rows = fallback.data as Record<string, unknown>[];
  }

  if (!rows) return [];
  return rows.map((row) => parseSectorListItem(row));
}

export async function fetchSectorById(id: string): Promise<Sector | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectores")
    .select(SECTOR_COLUMNS_WITH_AUTHOR)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return parseSectorListItem(data as Record<string, unknown>);
}
