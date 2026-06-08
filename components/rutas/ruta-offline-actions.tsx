"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { RouteBbox } from "@/lib/gpx";
import {
  downloadRutaOffline,
  isRutaOffline,
  type DownloadProgress,
} from "@/lib/tiles";
import { Button } from "@/components/ui/button";

type RutaOfflineActionsProps = {
  rutaId: string;
  nombre: string;
  geojson: FeatureCollection;
  bbox: RouteBbox;
};

export function RutaOfflineActions({
  rutaId,
  nombre,
  geojson,
  bbox,
}: RutaOfflineActionsProps) {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshOfflineStatus = useCallback(async () => {
    setChecking(true);
    const available = await isRutaOffline(rutaId);
    setIsOffline(available);
    setChecking(false);
  }, [rutaId]);

  useEffect(() => {
    void refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setProgress(null);

    try {
      await downloadRutaOffline(
        { id: rutaId, nombre, geojson, bbox },
        (nextProgress) => {
          setProgress(nextProgress);
        },
      );
      setIsOffline(true);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Error al descargar la ruta offline.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleNavigate = () => {
    router.push(`/navegacion/${rutaId}`);
  };

  if (checking) {
    return (
      <Button type="button" variant="secondary" fullWidth disabled>
        Verificando estado offline…
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {isOffline ? (
        <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          ✓ Ruta disponible offline
        </p>
      ) : null}

      <Button type="button" fullWidth onClick={handleNavigate}>
        Navegar
      </Button>

      {!isOffline ? (
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={downloading}
          onClick={() => void handleDownload()}
        >
          {downloading ? "Descargando…" : "Descargar para offline"}
        </Button>
      ) : null}

      {downloading && progress ? (
        <p className="text-center text-sm text-muted">
          Descargando… {progress.current} de {progress.total} tiles
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
