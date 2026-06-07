import type { FeatureCollection, Position } from "geojson";
import toGeoJSON from "togeojson";

export type RouteBbox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ParsedGpx = {
  geojson: FeatureCollection;
  distanceKm: number;
  bbox: RouteBbox;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function extractCoordinatePaths(geojson: FeatureCollection): Position[][] {
  const paths: Position[][] = [];

  for (const feature of geojson.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === "LineString") {
      paths.push(geometry.coordinates);
      continue;
    }

    if (geometry.type === "MultiLineString") {
      paths.push(...geometry.coordinates);
      continue;
    }

    if (geometry.type === "GeometryCollection") {
      for (const part of geometry.geometries) {
        if (part.type === "LineString") {
          paths.push(part.coordinates);
        } else if (part.type === "MultiLineString") {
          paths.push(...part.coordinates);
        }
      }
    }
  }

  return paths;
}

export function calculateDistanceKm(geojson: FeatureCollection): number {
  const paths = extractCoordinatePaths(geojson);
  let totalKm = 0;

  for (const path of paths) {
    for (let index = 1; index < path.length; index += 1) {
      const [lon1, lat1] = path[index - 1];
      const [lon2, lat2] = path[index];
      if (
        typeof lat1 !== "number" ||
        typeof lon1 !== "number" ||
        typeof lat2 !== "number" ||
        typeof lon2 !== "number"
      ) {
        continue;
      }
      totalKm += haversineKm(lat1, lon1, lat2, lon2);
    }
  }

  return Math.round(totalKm * 100) / 100;
}

export function calculateBbox(geojson: FeatureCollection): RouteBbox | null {
  const paths = extractCoordinatePaths(geojson);
  if (paths.length === 0) return null;

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const path of paths) {
    for (const [lon, lat] of path) {
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      west = Math.min(west, lon);
    }
  }

  if (!Number.isFinite(north)) return null;

  return {
    north: Math.round(north * 1e6) / 1e6,
    south: Math.round(south * 1e6) / 1e6,
    east: Math.round(east * 1e6) / 1e6,
    west: Math.round(west * 1e6) / 1e6,
  };
}

export function gpxXmlToGeoJSON(gpxXml: string): FeatureCollection {
  return routeXmlToGeoJSON(gpxXml, "gpx");
}

function routeXmlToGeoJSON(xml: string, format: "gpx" | "kml"): FeatureCollection {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      format === "gpx"
        ? "El archivo GPX no es un XML válido."
        : "El archivo KML no es un XML válido.",
    );
  }

  const geojson =
    format === "gpx" ? toGeoJSON.gpx(doc) : toGeoJSON.kml(doc);
  if (!geojson.features.length) {
    throw new Error(
      format === "gpx"
        ? "El GPX no contiene un recorrido válido."
        : "El KML no contiene un recorrido válido.",
    );
  }

  return geojson;
}

function getRouteFileFormat(fileName: string): "gpx" | "kml" | null {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".gpx")) return "gpx";
  if (lowerName.endsWith(".kml")) return "kml";
  return null;
}

export async function parseGpxFile(file: File): Promise<ParsedGpx> {
  const format = getRouteFileFormat(file.name);
  if (!format) {
    throw new Error("Seleccioná un archivo con extensión .gpx o .kml");
  }

  const routeXml = await file.text();
  const geojson = routeXmlToGeoJSON(routeXml, format);
  const bbox = calculateBbox(geojson);

  if (!bbox) {
    throw new Error("No se pudieron calcular los límites del recorrido.");
  }

  const distanceKm = calculateDistanceKm(geojson);
  if (distanceKm <= 0) {
    throw new Error("El recorrido no tiene distancia calculable.");
  }

  return { geojson, distanceKm, bbox };
}

export function formatDistanceKm(distanceKm: number | null | undefined): string {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "—";
  return `${distanceKm.toFixed(2)} km`;
}

export function formatRouteDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function getGpxStoragePath(userId: string, rutaId: string): string {
  return `${userId}/${rutaId}.gpx`;
}
