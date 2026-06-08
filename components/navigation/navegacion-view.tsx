"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { RouteBbox } from "@/lib/gpx";
import { getOfflineRuta } from "@/lib/tiles";
import { NavigationMapLoader } from "@/components/navigation/navigation-map-loader";
import { Card } from "@/components/ui/card";

export type OnlineRutaData = {
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
};

type NavegacionViewProps = {
  rutaId: string;
  onlineRuta?: OnlineRutaData | null;
};

type LoadedRuta = {
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
  fromOfflineCache: boolean;
};

export function NavegacionView({ rutaId, onlineRuta }: NavegacionViewProps) {
  const [loadedRuta, setLoadedRuta] = useState<LoadedRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rutaId) return;

    void (async () => {
      try {
        const offline = await getOfflineRuta(rutaId);
        if (offline) {
          setLoadedRuta({
            nombre: offline.nombre,
            geojson: offline.geojson,
            bbox: offline.bbox,
            fromOfflineCache: true,
          });
          setError(null);
          return;
        }

        if (onlineRuta) {
          setLoadedRuta({
            nombre: onlineRuta.nombre,
            geojson: onlineRuta.geojson,
            bbox: onlineRuta.bbox,
            fromOfflineCache: false,
          });
          setError(null);
          return;
        }

        const offlineMessage =
          typeof navigator !== "undefined" && !navigator.onLine
            ? "Sin conexión. Descargá la ruta desde el detalle para navegar offline."
            : "No se pudo cargar la ruta para navegación.";

        setLoadedRuta(null);
        setError(offlineMessage);
      } catch (loadError) {
        setLoadedRuta(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la ruta.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [rutaId, onlineRuta]);

  if (loading) {
    return (
      <Card className="py-8 text-center text-sm text-muted">
        Cargando navegación…
      </Card>
    );
  }

  if (error || !loadedRuta) {
    return (
      <Card accent className="space-y-3">
        <p role="alert" className="text-sm text-red-300">
          {error ?? "Ruta no encontrada."}
        </p>
        <Link
          href={rutaId ? `/rutas/${rutaId}` : "/"}
          className="inline-flex text-sm text-emerald-300 hover:text-emerald-200"
        >
          ← Volver al detalle de la ruta
        </Link>
      </Card>
    );
  }

  return (
    <NavigationMapLoader
      rutaId={rutaId}
      geojson={loadedRuta.geojson}
      bbox={loadedRuta.bbox}
      rutaNombre={loadedRuta.nombre}
      fromOfflineCache={loadedRuta.fromOfflineCache}
    />
  );
}
