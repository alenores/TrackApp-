"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import type { RouteBbox } from "@/lib/gpx";
import "leaflet/dist/leaflet.css";

type RouteMapProps = {
  geojson: FeatureCollection;
  bbox?: RouteBbox | null;
  className?: string;
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

export function RouteMap({ geojson, bbox, className = "" }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    const layer = L.geoJSON(geojson, {
      style: ROUTE_STYLE,
    });
    layer.addTo(map);
    layerRef.current = layer;

    if (bbox) {
      map.fitBounds(boundsFromBbox(bbox), { padding: [24, 24] });
      return;
    }

    const layerBounds = layer.getBounds();
    if (layerBounds.isValid()) {
      map.fitBounds(layerBounds, { padding: [24, 24] });
    }
  }, [geojson, bbox]);

  return (
    <div
      ref={containerRef}
      className={[
        "h-64 w-full overflow-hidden rounded-xl border border-border bg-slate-900 sm:h-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
