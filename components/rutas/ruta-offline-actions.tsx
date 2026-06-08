"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { RouteBbox } from "@/lib/gpx";
import { notifyRutaOfflineUpdated } from "@/lib/rutas/offline-events";
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      notifyRutaOfflineUpdated(rutaId);
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
          <span className="inline-flex items-center justify-center gap-2">
            <DownloadIcon />
            {downloading ? "Descargando…" : "Descargar para offline"}
          </span>
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
