"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import type { RouteBbox } from "@/lib/gpx";
import {
  DEVIATION_THRESHOLD_METERS,
  getDistanceToRouteMeters,
  getGpsErrorMessage,
  type GpsStatus,
} from "@/lib/navigation";
import { createOfflineTileLayer } from "@/components/map/offline-tile-layer";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

type NavigationMapProps = {
  geojson: FeatureCollection;
  bbox: RouteBbox;
  rutaNombre: string;
  fromOfflineCache?: boolean;
};

const ROUTE_STYLE: L.PathOptions = {
  color: "#40916c",
  weight: 5,
  opacity: 0.92,
  lineCap: "round",
  lineJoin: "round",
};

function boundsFromBbox(bbox: RouteBbox): L.LatLngBoundsExpression {
  return [
    [bbox.south, bbox.west],
    [bbox.north, bbox.east],
  ];
}

export function NavigationMap({
  geojson,
  bbox,
  rutaNombre,
  fromOfflineCache = false,
}: NavigationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const onRoute =
    distanceMeters !== null && distanceMeters <= DEVIATION_THRESHOLD_METERS;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    createOfflineTileLayer().addTo(map);
    mapRef.current = map;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
    }

    const layer = L.geoJSON(geojson, { style: ROUTE_STYLE });
    layer.addTo(map);
    routeLayerRef.current = layer;
    map.fitBounds(boundsFromBbox(bbox), { padding: [32, 32] });
  }, [geojson, bbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    const latLng: L.LatLngExpression = [position.lat, position.lng];

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker(latLng, {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
    }
  }, [position]);

  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Tu dispositivo no soporta geolocalización.");
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("requesting");
    setGpsError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        setGpsStatus("active");
        setDistanceMeters(getDistanceToRouteMeters(lat, lng, geojson));
      },
      (error) => {
        setGpsError(getGpsErrorMessage(error));
        setGpsStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      },
    );
  }, [geojson]);

  const centerOnUser = useCallback(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [position]);

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[420px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{rutaNombre}</h1>
          <p className="text-xs text-muted">
            {fromOfflineCache ? "Navegación offline" : "Navegación con conexión"}
          </p>
        </div>
        {gpsStatus === "active" && distanceMeters !== null ? (
          <div
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold",
              onRoute
                ? "bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-800/60"
                : "bg-red-950/70 text-red-200 ring-1 ring-red-800/60",
            ].join(" ")}
          >
            {onRoute ? "En ruta" : "¡Fuera de ruta!"}
          </div>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-slate-900"
      />

      <div className="space-y-2">
        {gpsStatus === "idle" || gpsStatus === "requesting" ? (
          <Button
            type="button"
            fullWidth
            disabled={gpsStatus === "requesting"}
            onClick={startGps}
          >
            {gpsStatus === "requesting"
              ? "Activando GPS…"
              : "Activar GPS"}
          </Button>
        ) : null}

        {gpsStatus === "active" ? (
          <Button type="button" variant="secondary" fullWidth onClick={centerOnUser}>
            Centrar en mi posición
          </Button>
        ) : null}

        {gpsError ? (
          <p role="alert" className="text-sm text-red-400">
            {gpsError}
          </p>
        ) : null}

        {gpsStatus === "active" && distanceMeters !== null ? (
          <p className="text-center text-xs text-muted">
            Distancia a la ruta: {Math.round(distanceMeters)} m
            {onRoute
              ? " · dentro del umbral de 50 m"
              : ` · supera ${DEVIATION_THRESHOLD_METERS} m`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
