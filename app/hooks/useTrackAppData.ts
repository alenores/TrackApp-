"use client";

import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { createClient } from "@/lib/supabase/client";
import {
  getRutasCache,
  setRutasCache,
  getLastNovedadId,
  setLastNovedadId,
} from "@/lib/offline-cache";
import { autoSyncRutaGeojson } from "@/lib/tiles";
import type { RutaListItem } from "@/types/database";
import type { RouteBbox } from "@/lib/gpx";

export type TrackAppEstado =
  | "ok"
  | "sincronizando"
  | "sin_conexion"
  | "sin_datos";

export type TrackAppData = {
  rutas: RutaListItem[];
  loading: boolean;
  error: string | null;
  estado: TrackAppEstado;
  sincronizando: boolean;
};

const RUTA_LIST_COLUMNS =
  "id, nombre, descripcion, distancia_km, user_id, subido_por_nombre, created_at, actividades";

const RUTA_LIST_COLUMNS_BASE =
  "id, nombre, descripcion, distancia_km, user_id, created_at, actividades";

type RutaGeojsonRow = {
  id: string;
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
};

async function fetchRutasFromSupabase(): Promise<RutaListItem[]> {
  const supabase = createClient();

  const primary = await supabase
    .from("rutas")
    .select(RUTA_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (!primary.error && primary.data) {
    return primary.data as RutaListItem[];
  }

  const fallback = await supabase
    .from("rutas")
    .select(RUTA_LIST_COLUMNS_BASE)
    .order("created_at", { ascending: false });

  if (!fallback.error && fallback.data) {
    return fallback.data as RutaListItem[];
  }

  return [];
}

async function fetchRutasGeojsonFromSupabase(): Promise<RutaGeojsonRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rutas")
    .select("id, nombre, geojson, bbox");

  if (error || !data) return [];
  return (data as RutaGeojsonRow[]).filter((r) => r.geojson && r.bbox);
}

async function fetchMaxNovedadId(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("novedades")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { id: number } | null)?.id ?? 0;
}

async function syncGeojsonToIndexedDB(cancelled: () => boolean): Promise<void> {
  const rows = await fetchRutasGeojsonFromSupabase();
  for (const row of rows) {
    if (cancelled()) return;
    await autoSyncRutaGeojson(row);
  }
}

export function useTrackAppData(): TrackAppData {
  const [rutas, setRutas] = useState<RutaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<TrackAppEstado>("sincronizando");
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const isOnline = navigator.onLine;

      if (!isOnline) {
        const cache = getRutasCache();
        if (cache) {
          if (!cancelled) {
            setRutas(cache);
            setEstado("sin_conexion");
            setLoading(false);
          }
        } else {
          if (!cancelled) {
            setEstado("sin_datos");
            setLoading(false);
          }
        }
        return;
      }

      setSincronizando(true);

      try {
        const [maxId, cache] = await Promise.all([
          fetchMaxNovedadId(),
          Promise.resolve(getRutasCache()),
        ]);

        const lastId = getLastNovedadId();
        const needsSync = maxId !== lastId || !cache;

        if (needsSync) {
          const fresh = await fetchRutasFromSupabase();
          if (!cancelled) {
            setRutasCache(fresh);
            setLastNovedadId(maxId);
            setRutas(fresh);
          }
        } else {
          if (!cancelled) {
            setRutas(cache);
          }
        }

        // Mostrar la lista cuanto antes; geojson sync continúa en background
        if (!cancelled) {
          setEstado("ok");
          setLoading(false);
        }

        if (needsSync) {
          await syncGeojsonToIndexedDB(() => cancelled);
        }
      } catch (err) {
        const cache = getRutasCache();
        if (!cancelled) {
          if (cache) {
            setRutas(cache);
            setEstado("sin_conexion");
          } else {
            setError(err instanceof Error ? err.message : "Error al cargar datos");
            setEstado("sin_datos");
          }
          setLoading(false);
        }
      } finally {
        if (!cancelled) {
          setSincronizando(false);
        }
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rutas, loading, error, estado, sincronizando };
}
