import type { Rectangulo } from "@/types/database";

/**
 * Las tres tablas que tienen rectángulo (zonas, sectores y rutas) guardan los
 * mismos cuatro números con los mismos nombres. La traducción vive acá una sola
 * vez.
 */

export type ColumnasRectangulo = {
  lat_norte: number;
  lat_sur: number;
  lon_este: number;
  lon_oeste: number;
};

export const COLUMNAS_RECTANGULO = "lat_norte, lat_sur, lon_este, lon_oeste";

export function leerRectangulo(fila: ColumnasRectangulo): Rectangulo {
  return {
    latNorte: Number(fila.lat_norte),
    latSur: Number(fila.lat_sur),
    lonEste: Number(fila.lon_este),
    lonOeste: Number(fila.lon_oeste),
  };
}

export function escribirRectangulo(
  rectangulo: Rectangulo,
): ColumnasRectangulo {
  return {
    lat_norte: rectangulo.latNorte,
    lat_sur: rectangulo.latSur,
    lon_este: rectangulo.lonEste,
    lon_oeste: rectangulo.lonOeste,
  };
}

/**
 * La base rechaza un rectángulo dado vuelta, pero conviene detectarlo antes de
 * mandarlo para poder decirle a la persona qué pasó en vez de mostrarle el
 * error crudo de la base.
 */
export function rectanguloEsValido(rectangulo: Rectangulo): boolean {
  return (
    Number.isFinite(rectangulo.latNorte) &&
    Number.isFinite(rectangulo.latSur) &&
    Number.isFinite(rectangulo.lonEste) &&
    Number.isFinite(rectangulo.lonOeste) &&
    rectangulo.latNorte > rectangulo.latSur &&
    rectangulo.lonEste > rectangulo.lonOeste
  );
}

/** ¿Los dos rectángulos se tocan en algún punto? */
export function seSuperponen(a: Rectangulo, b: Rectangulo): boolean {
  return (
    a.latSur <= b.latNorte &&
    a.latNorte >= b.latSur &&
    a.lonOeste <= b.lonEste &&
    a.lonEste >= b.lonOeste
  );
}

/** El rectángulo más chico que contiene a todos los puntos dados. */
export function rectanguloQueAbarca(
  coordenadas: Array<[lon: number, lat: number]>,
): Rectangulo | null {
  if (coordenadas.length === 0) return null;

  let latNorte = -Infinity;
  let latSur = Infinity;
  let lonEste = -Infinity;
  let lonOeste = Infinity;

  for (const [lon, lat] of coordenadas) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (lat > latNorte) latNorte = lat;
    if (lat < latSur) latSur = lat;
    if (lon > lonEste) lonEste = lon;
    if (lon < lonOeste) lonOeste = lon;
  }

  if (!Number.isFinite(latNorte) || !Number.isFinite(lonOeste)) return null;

  return { latNorte, latSur, lonEste, lonOeste };
}
