"use client";

import dynamic from "next/dynamic";
import type { RouteBbox } from "@/lib/gpx";
import type { FeatureCollection } from "geojson";

type NavigationMapLoaderProps = {
  geojson: FeatureCollection;
  bbox: RouteBbox;
  rutaNombre: string;
};

const NavigationMap = dynamic(
  () =>
    import("./navigation-map").then((module) => module.NavigationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-8rem)] min-h-[420px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted">
        Cargando mapa de navegación…
      </div>
    ),
  },
);

export function NavigationMapLoader(props: NavigationMapLoaderProps) {
  return <NavigationMap {...props} />;
}
