import type { VistaDelMapa } from "@/lib/mapas/vista";

/** Abre la vista de Google Maps sin buscar lugares ni agregar un marcador. */
export function enlaceAGoogleMaps(vista: VistaDelMapa): string {
  const parametros = new URLSearchParams({
    api: "1",
    map_action: "map",
    center: `${vista.lat},${vista.lon}`,
    zoom: String(Math.max(0, Math.min(21, Math.round(vista.zoom)))),
  });
  return `https://www.google.com/maps/@?${parametros}`;
}
