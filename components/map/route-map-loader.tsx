"use client";

import dynamic from "next/dynamic";
import type { FeatureCollection } from "geojson";
import type { RouteBbox } from "@/lib/gpx";

type RouteMapLoaderProps = {
  geojson: FeatureCollection;
  bbox?: RouteBbox | null;
  className?: string;
};

const RouteMap = dynamic(
  () => import("./route-map").then((module) => module.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted sm:h-80">
        Cargando mapa…
      </div>
    ),
  },
);

export function RouteMapLoader(props: RouteMapLoaderProps) {
  return <RouteMap {...props} />;
}
