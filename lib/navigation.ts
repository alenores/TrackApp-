import type { FeatureCollection, Position } from "geojson";
import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";

export const DEVIATION_THRESHOLD_METERS = 50;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadiusM = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
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

export function getDistanceToRouteMeters(
  lat: number,
  lon: number,
  geojson: FeatureCollection,
): number {
  const paths = extractCoordinatePaths(geojson);
  if (paths.length === 0) return Infinity;

  const userPoint = point([lon, lat]);
  let minDistance = Infinity;

  for (const path of paths) {
    if (path.length < 2) continue;
    const line = lineString(path);
    const nearest = nearestPointOnLine(line, userPoint);
    const [nearestLon, nearestLat] = nearest.geometry.coordinates;
    if (typeof nearestLat !== "number" || typeof nearestLon !== "number") {
      continue;
    }
    const distance = haversineMeters(lat, lon, nearestLat, nearestLon);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

export function isOnRoute(
  lat: number,
  lon: number,
  geojson: FeatureCollection,
  thresholdMeters: number = DEVIATION_THRESHOLD_METERS,
): boolean {
  return getDistanceToRouteMeters(lat, lon, geojson) <= thresholdMeters;
}

export type GpsStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unavailable";

export function getGpsErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Permiso de GPS denegado. Activá la ubicación para esta app en ajustes del navegador.";
    case error.POSITION_UNAVAILABLE:
      return "No se pudo obtener tu ubicación. Verificá que el GPS esté activo.";
    case error.TIMEOUT:
      return "Tiempo de espera agotado al obtener la ubicación.";
    default:
      return "Error desconocido al acceder al GPS.";
  }
}
