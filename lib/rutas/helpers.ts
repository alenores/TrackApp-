import type { Ruta } from "@/types/database";

export function getUploaderLabel(
  ruta: Ruta,
  currentUserId: string | null,
  currentUserName: string | null,
): string {
  if (currentUserId && ruta.user_id === currentUserId) {
    return currentUserName ? `${currentUserName} (vos)` : "Vos";
  }

  return `Usuario · ${ruta.user_id.slice(0, 8)}`;
}

export function parseRutaRow(row: Record<string, unknown>): Ruta {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    nombre: String(row.nombre),
    descripcion:
      row.descripcion == null ? null : String(row.descripcion),
    distancia_km:
      row.distancia_km == null ? null : Number(row.distancia_km),
    gpx_url: row.gpx_url == null ? null : String(row.gpx_url),
    geojson: row.geojson as Ruta["geojson"],
    bbox: row.bbox as Ruta["bbox"],
    created_at: String(row.created_at),
  };
}
