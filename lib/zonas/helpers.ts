import type { RouteBbox } from "@/lib/gpx";
import type { SectorListItem, ZonaListItem } from "@/types/database";
import { getAllTilesForBbox } from "@/lib/tiles";

export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type ProvinciaArgentina = (typeof PROVINCIAS_ARGENTINA)[number];

export const MAX_SECTOR_ZOOM = 15;
export const KB_PER_TILE = 25;
export const DOWNLOAD_CONFIRM_TILES = 300;

export function getSectorZoomLevels(zoomMinimo: number): number[] {
  const levels: number[] = [];
  for (let z = Math.max(10, zoomMinimo); z <= MAX_SECTOR_ZOOM; z++) {
    levels.push(z);
  }
  return levels;
}

export function getSectorBbox(sector: SectorListItem): RouteBbox {
  return {
    north: Math.max(sector.lat_ne, sector.lat_no),
    south: Math.min(sector.lat_se, sector.lat_so),
    east: Math.max(sector.lon_ne, sector.lon_se),
    west: Math.min(sector.lon_no, sector.lon_so),
  };
}

export function estimateSectorTileCount(sector: SectorListItem): number {
  const bbox = getSectorBbox(sector);
  const zoomLevels = getSectorZoomLevels(sector.zoom_minimo);
  return getAllTilesForBbox(bbox, zoomLevels).length;
}

export function formatSectorSize(tileCount: number): string {
  const kb = tileCount * KB_PER_TILE;
  if (kb < 1000) return `~${kb} KB`;
  return `~${(kb / 1024).toFixed(1)} MB`;
}

type UploaderSource = Pick<ZonaListItem, "user_id" | "subido_por_nombre">;

export function getZonaUploaderLabel(
  item: UploaderSource,
  currentUserId: string | null,
  currentUserName: string | null,
): string {
  if (currentUserId && item.user_id === currentUserId) {
    return currentUserName ? `${currentUserName} (vos)` : "Vos";
  }
  if (item.subido_por_nombre) return item.subido_por_nombre;
  return `Usuario · ${item.user_id.slice(0, 8)}`;
}

export function parseZonaListItem(row: Record<string, unknown>): ZonaListItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    provincia: String(row.provincia),
    nombre: String(row.nombre),
    descripcion: row.descripcion == null ? null : String(row.descripcion),
    subido_por_nombre:
      row.subido_por_nombre == null ? null : String(row.subido_por_nombre),
    created_at: String(row.created_at),
  };
}

export function parseSectorListItem(
  row: Record<string, unknown>,
): SectorListItem {
  return {
    id: String(row.id),
    zona_id: String(row.zona_id),
    user_id: String(row.user_id),
    nombre: String(row.nombre),
    descripcion: row.descripcion == null ? null : String(row.descripcion),
    lat_ne: Number(row.lat_ne),
    lon_ne: Number(row.lon_ne),
    lat_se: Number(row.lat_se),
    lon_se: Number(row.lon_se),
    lat_so: Number(row.lat_so),
    lon_so: Number(row.lon_so),
    lat_no: Number(row.lat_no),
    lon_no: Number(row.lon_no),
    zoom_minimo: Number(row.zoom_minimo),
    subido_por_nombre:
      row.subido_por_nombre == null ? null : String(row.subido_por_nombre),
    created_at: String(row.created_at),
  };
}
