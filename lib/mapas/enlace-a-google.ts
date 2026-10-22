import type { VistaDelMapa } from "@/lib/mapas/vista";

/** Abre la vista de Google Maps sin buscar lugares ni agregar un marcador. */
export function enlaceAGoogleMaps(vista: VistaDelMapa): string {
  // El mapa propio parte de 512 px; Google, de 256 px. Para conservar la
  // escala hace falta un nivel más en Google (512·2^z = 256·2^(z+1)).
  const zoomGoogle = Math.max(0, Math.min(21, Math.round(vista.zoom + 1)));
  const parametros = new URLSearchParams({
    api: "1",
    map_action: "map",
    center: `${vista.lat},${vista.lon}`,
    zoom: String(zoomGoogle),
  });
  return `https://www.google.com/maps/@?${parametros}`;
}
