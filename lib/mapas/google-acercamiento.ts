import type { Map as MapaLibre } from "maplibre-gl";

/** Las mismas opciones que usa la fuente raster de Google. */
export const COBERTURA_DE_GOOGLE = { tileSize: 256, minzoom: 0, maxzoom: 22, roundZoom: true } as const;

/** El nivel de la imagen, no el zoom de cámara ni su ampliación. */
export function nivelDeImagenDeGoogle(mapa: Pick<MapaLibre, "coveringTiles">): number | null {
  try {
    const teselas = mapa.coveringTiles(COBERTURA_DE_GOOGLE);
    const niveles = new Set(teselas.map((tesela) => tesela.canonical.z));
    if (niveles.size !== 1) return null;
    const nivel = niveles.values().next().value;
    return nivel !== undefined && Number.isInteger(nivel) && nivel >= COBERTURA_DE_GOOGLE.minzoom && nivel <= COBERTURA_DE_GOOGLE.maxzoom
      ? nivel : null;
  } catch {
    return null;
  }
}
/** Áreas en las que Google informa hasta qué nivel existe imagen real. */
export type AreaConDetalleDeGoogle = {
  maxZoom: number;
  north: number;
  south: number;
  east: number;
  west: number;
};

export type RespuestaDeDetalleDeGoogle = {
  derechos: string | null;
  areasConDetalle: AreaConDetalleDeGoogle[];
};

/** El mayor detalle del centro; si no hay coincidencia, el mayor de la vista. */
export function maximoDetalleDeGoogle(
  areas: AreaConDetalleDeGoogle[],
  posicion: { lat: number; lng: number },
): number | null {
  const longitud = ((posicion.lng + 180) % 360 + 360) % 360 - 180;
  const validas = areas.filter((area) =>
    Number.isInteger(area.maxZoom) && area.maxZoom >= 0 && area.maxZoom <= 22);
  const niveles = validas
    .filter((area) =>
      Number.isFinite(area.north) && Number.isFinite(area.south) &&
      Number.isFinite(area.east) && Number.isFinite(area.west) &&
      posicion.lat >= area.south && posicion.lat <= area.north &&
      (area.west <= area.east
        ? longitud >= area.west && longitud <= area.east
        : longitud >= area.west || longitud <= area.east),
    )
    .map((area) => area.maxZoom);
  if (niveles.length) return Math.max(...niveles);
  return validas.length ? Math.max(...validas.map((area) => area.maxZoom)) : null;
}

/** Conserva el límite conocido si la respuesta nueva no informa otro. */
export function limiteDeGoogleSinRetroceso(
  limiteActual: number,
  zoomActual: number,
  maximoInformado: number | null,
): number {
  return maximoInformado === null ? limiteActual : Math.max(zoomActual, maximoInformado - Math.log2(512 / COBERTURA_DE_GOOGLE.tileSize));
}

/** Una consulta para las imágenes de esta vista; no busca autoría en otras escalas. */
export async function detalleConCreditosDeGoogle(
  consulta: URLSearchParams,
  posicion: { lat: number; lng: number },
  traer: (consulta: URLSearchParams) => Promise<RespuestaDeDetalleDeGoogle>,
  sigueActivo: () => boolean = () => true,
  alInformarMaximo?: (maximo: number | null) => void,
): Promise<{ derechos: string | null; maximo: number | null } | null> {
  if (!sigueActivo()) return null;
  const respuesta = await traer(new URLSearchParams(consulta));
  if (!sigueActivo()) return null;
  const maximo = maximoDetalleDeGoogle(respuesta.areasConDetalle, posicion);
  alInformarMaximo?.(maximo);
  if (!sigueActivo()) return null;
  return { derechos: respuesta.derechos, maximo };
}
