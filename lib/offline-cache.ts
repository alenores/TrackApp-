import type { RutaListItem, ZonaListItem } from "@/types/database";

const RUTAS_CACHE_KEY = "trackapp_rutas";
const LAST_NOVEDAD_ID_KEY = "trackapp_last_novedad_id";
const CACHE_COOKIE = "trackapp_has_cache";
const ZONAS_CACHE_KEY = "trackapp_zonas";
const LAST_ZONA_NOVEDAD_ID_KEY = "trackapp_last_zona_novedad_id";

function setCacheCookie() {
  if (typeof document === "undefined") return;
  // 30 días — sobrevive reinicios del browser
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${CACHE_COOKIE}=1; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCacheCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${CACHE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getRutasCache(): RutaListItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RUTAS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RutaListItem[];
  } catch {
    return null;
  }
}

export function setRutasCache(rutas: RutaListItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RUTAS_CACHE_KEY, JSON.stringify(rutas));
    setCacheCookie();
  } catch {
    // localStorage puede estar lleno o bloqueado (modo privado en algunos browsers)
  }
}

export function getLastNovedadId(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LAST_NOVEDAD_ID_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setLastNovedadId(id: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_NOVEDAD_ID_KEY, String(id));
  } catch {
    // silently fail
  }
}

export function clearOfflineCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RUTAS_CACHE_KEY);
    localStorage.removeItem(LAST_NOVEDAD_ID_KEY);
    localStorage.removeItem(ZONAS_CACHE_KEY);
    localStorage.removeItem(LAST_ZONA_NOVEDAD_ID_KEY);
    clearCacheCookie();
  } catch {
    // silently fail
  }
}

export function getZonasCache(): ZonaListItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ZONAS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ZonaListItem[];
  } catch {
    return null;
  }
}

export function setZonasCache(zonas: ZonaListItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ZONAS_CACHE_KEY, JSON.stringify(zonas));
  } catch {
    // silently fail
  }
}

export function getLastZonaNovedadId(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LAST_ZONA_NOVEDAD_ID_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setLastZonaNovedadId(id: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ZONA_NOVEDAD_ID_KEY, String(id));
  } catch {
    // silently fail
  }
}
