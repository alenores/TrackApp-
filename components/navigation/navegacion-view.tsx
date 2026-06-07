"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOfflineRuta, type OfflineRuta } from "@/lib/tiles";
import { NavigationMapLoader } from "@/components/navigation/navigation-map-loader";
import { Card } from "@/components/ui/card";

export function NavegacionView() {
  const params = useParams<{ id: string }>();
  const rutaId = params.id;

  const [offlineRuta, setOfflineRuta] = useState<OfflineRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rutaId) return;

    void (async () => {
      try {
        const data = await getOfflineRuta(rutaId);
        if (!data) {
          setError(
            "Esta ruta no está disponible offline. Descargala desde el detalle de la ruta.",
          );
          setOfflineRuta(null);
          return;
        }
        setOfflineRuta(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la ruta offline.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [rutaId]);

  if (loading) {
    return (
      <Card className="py-8 text-center text-sm text-muted">
        Cargando ruta offline…
      </Card>
    );
  }

  if (error || !offlineRuta) {
    return (
      <Card accent className="space-y-3">
        <p role="alert" className="text-sm text-red-300">
          {error ?? "Ruta offline no encontrada."}
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
      geojson={offlineRuta.geojson}
      bbox={offlineRuta.bbox}
      rutaNombre={offlineRuta.nombre}
    />
  );
}
