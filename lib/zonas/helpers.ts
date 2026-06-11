import type { RouteBbox } from "@/lib/gpx";
import type { SectorListItem } from "@/types/database";
import { getAllTilesForBbox } from "@/lib/tiles";

export {
  PROVINCIAS_ARGENTINA,
  getZonaUploaderLabel,
  parseSectorListItem,
  parseZonaListItem,
} from "@/lib/zonas/labels";
export type { ProvinciaArgentina } from "@/lib/zonas/labels";

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
