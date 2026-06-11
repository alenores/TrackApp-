import type { FeatureCollection } from "geojson";
import type { RouteBbox } from "@/lib/gpx";

const DB_NAME = "trackapp-offline";
const DB_VERSION = 2;
const TILES_STORE = "tiles";
const RUTAS_STORE = "rutas";
const SECTORES_STORE = "sectores";

export const OFFLINE_ZOOM_LEVELS = [12, 13, 14, 15] as const;

export type TileCoord = {
  z: number;
  x: number;
  y: number;
};

export type OfflineRuta = {
  id: string;
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
  downloadedAt: string;
  tileCount: number;
};

export type OfflineSector = {
  id: string;
  nombre: string;
  bbox: RouteBbox;
  downloadedAt: string;
  tileCount: number;
};

export type DownloadProgress = {
  current: number;
  total: number;
};

type TileRecord = {
  id: string;
  blob: Blob;
};

function tileKey(z: number, x: number, y: number): string {
  return `tile_${z}_${x}_${y}`;
}

export function rutaKey(rutaId: string): string {
  return `ruta_${rutaId}`;
}

export function sectorKey(sectorId: string): string {
  return `sector_${sectorId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no está disponible en este navegador."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TILES_STORE)) {
        db.createObjectStore(TILES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(RUTAS_STORE)) {
        db.createObjectStore(RUTAS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SECTORES_STORE)) {
        db.createObjectStore(SECTORES_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = operation(store);

        tx.oncomplete = () => {
          if (request && "result" in request) {
            resolve((request as IDBRequest<T>).result);
            return;
          }
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error ?? new Error("Error en transacción IndexedDB."));
        };
      }),
  );
}

export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

export function lat2tile(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      2 ** zoom,
  );
}

export function getTilesForBbox(bbox: RouteBbox, zoom: number): TileCoord[] {
  const xMin = lon2tile(bbox.west, zoom);
  const xMax = lon2tile(bbox.east, zoom);
  const yMin = lat2tile(bbox.north, zoom);
  const yMax = lat2tile(bbox.south, zoom);

  const tiles: TileCoord[] = [];

  for (let x = xMin; x <= xMax; x += 1) {
    for (let y = yMin; y <= yMax; y += 1) {
      tiles.push({ z: zoom, x, y });
    }
  }

  return tiles;
}

export function getAllTilesForBbox(
  bbox: RouteBbox,
  zoomLevels: readonly number[] = OFFLINE_ZOOM_LEVELS,
): TileCoord[] {
  const seen = new Set<string>();
  const tiles: TileCoord[] = [];

  for (const z of zoomLevels) {
    for (const tile of getTilesForBbox(bbox, z)) {
      const key = tileKey(tile.z, tile.x, tile.y);
      if (seen.has(key)) continue;
      seen.add(key);
      tiles.push(tile);
    }
  }

  return tiles;
}

export function getOsmTileUrl(z: number, x: number, y: number): string {
  const subdomains = ["a", "b", "c"];
  const s = subdomains[(x + y) % subdomains.length];
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export async function saveTile(
  z: number,
  x: number,
  y: number,
  blob: Blob,
): Promise<void> {
  const record: TileRecord = { id: tileKey(z, x, y), blob };
  await runTransaction(TILES_STORE, "readwrite", (store) =>
    store.put(record),
  );
}

export async function getTile(
  z: number,
  x: number,
  y: number,
): Promise<Blob | null> {
  const result = await runTransaction<TileRecord>(
    TILES_STORE,
    "readonly",
    (store) => store.get(tileKey(z, x, y)),
  );
  return result?.blob ?? null;
}

export async function saveOfflineRuta(ruta: OfflineRuta): Promise<void> {
  await runTransaction(RUTAS_STORE, "readwrite", (store) => store.put(ruta));
}

export async function getOfflineRuta(
  rutaId: string,
): Promise<OfflineRuta | null> {
  const result = await runTransaction<OfflineRuta>(
    RUTAS_STORE,
    "readonly",
    (store) => store.get(rutaKey(rutaId)),
  );
  return result ?? null;
}

export async function isRutaOffline(rutaId: string): Promise<boolean> {
  const ruta = await getOfflineRuta(rutaId);
  return ruta !== null;
}

async function fetchTileBlob(z: number, x: number, y: number): Promise<Blob> {
  const response = await fetch(getOsmTileUrl(z, x, y));
  if (!response.ok) {
    throw new Error(`No se pudo descargar tile ${z}/${x}/${y}`);
  }
  return response.blob();
}

export async function downloadRutaOffline(
  ruta: {
    id: string;
    nombre: string;
    geojson: FeatureCollection;
    bbox: RouteBbox;
  },
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const tiles = getAllTilesForBbox(ruta.bbox);
  const total = tiles.length;

  if (total === 0) {
    throw new Error("No hay tiles para descargar con el bbox de esta ruta.");
  }

  for (let index = 0; index < tiles.length; index += 1) {
    const { z, x, y } = tiles[index];
    const existing = await getTile(z, x, y);
    if (!existing) {
      const blob = await fetchTileBlob(z, x, y);
      await saveTile(z, x, y, blob);
    }
    onProgress?.({ current: index + 1, total });
  }

  await saveOfflineRuta({
    id: rutaKey(ruta.id),
    nombre: ruta.nombre,
    geojson: ruta.geojson,
    bbox: ruta.bbox,
    downloadedAt: new Date().toISOString(),
    tileCount: total,
  });
}

export async function deleteOfflineRuta(rutaId: string): Promise<void> {
  await runTransaction(RUTAS_STORE, "readwrite", (store) =>
    store.delete(rutaKey(rutaId)),
  );
}

export async function saveOfflineSector(sector: OfflineSector): Promise<void> {
  await runTransaction(SECTORES_STORE, "readwrite", (store) =>
    store.put(sector),
  );
}

export async function getOfflineSector(
  sectorId: string,
): Promise<OfflineSector | null> {
  const result = await runTransaction<OfflineSector>(
    SECTORES_STORE,
    "readonly",
    (store) => store.get(sectorKey(sectorId)),
  );
  return result ?? null;
}

export async function isSectorOffline(sectorId: string): Promise<boolean> {
  const sector = await getOfflineSector(sectorId);
  return sector !== null;
}

export async function deleteOfflineSector(sectorId: string): Promise<void> {
  await runTransaction(SECTORES_STORE, "readwrite", (store) =>
    store.delete(sectorKey(sectorId)),
  );
}

export async function downloadSectorOffline(
  sector: { id: string; nombre: string; bbox: RouteBbox },
  zoomLevels: number[],
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const tiles = getAllTilesForBbox(sector.bbox, zoomLevels);
  const total = tiles.length;

  if (total === 0) {
    throw new Error("No hay tiles para descargar con el bbox de este sector.");
  }

  for (let index = 0; index < tiles.length; index += 1) {
    const { z, x, y } = tiles[index];
    const existing = await getTile(z, x, y);
    if (!existing) {
      const blob = await fetchTileBlob(z, x, y);
      await saveTile(z, x, y, blob);
    }
    onProgress?.({ current: index + 1, total });
  }

  await saveOfflineSector({
    id: sectorKey(sector.id),
    nombre: sector.nombre,
    bbox: sector.bbox,
    downloadedAt: new Date().toISOString(),
    tileCount: total,
  });
}

/**
 * Guarda geojson+bbox en IndexedDB de forma automática (sin tiles).
 * Si ya existe un registro con tiles descargados, preserva el tileCount.
 */
export async function autoSyncRutaGeojson(ruta: {
  id: string;
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
}): Promise<void> {
  const existing = await getOfflineRuta(ruta.id);
  await saveOfflineRuta({
    id: rutaKey(ruta.id),
    nombre: ruta.nombre,
    geojson: ruta.geojson,
    bbox: ruta.bbox,
    downloadedAt: existing?.downloadedAt ?? new Date().toISOString(),
    tileCount: existing?.tileCount ?? 0,
  });
}
