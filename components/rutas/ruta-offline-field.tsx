"use client";

import { useCallback, useEffect, useState } from "react";
import { OfflineBookmarkIcon } from "@/components/rutas/offline-bookmark-icon";
import {
  RUTA_DATA_CELL_CLASS,
  RUTA_DATA_LABEL_CLASS,
} from "@/lib/rutas/data-cell-styles";
import { RUTA_OFFLINE_UPDATED_EVENT } from "@/lib/rutas/offline-events";
import { isRutaOffline } from "@/lib/tiles";

type RutaOfflineFieldProps = {
  rutaId: string;
};

export function RutaOfflineField({ rutaId }: RutaOfflineFieldProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    const available = await isRutaOffline(rutaId);
    setIsOffline(available);
    setChecking(false);
  }, [rutaId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ rutaId: string }>;
      if (customEvent.detail?.rutaId === rutaId) {
        void refreshStatus();
      }
    };

    window.addEventListener(RUTA_OFFLINE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(RUTA_OFFLINE_UPDATED_EVENT, handleUpdate);
    };
  }, [rutaId, refreshStatus]);

  return (
    <div className={RUTA_DATA_CELL_CLASS}>
      <dt className={RUTA_DATA_LABEL_CLASS}>Offline</dt>
      <dd className="mt-0.5 font-medium">
        {checking ? (
          <span className="text-muted">…</span>
        ) : isOffline ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-200">
            <OfflineBookmarkIcon className="h-3.5 w-3.5 shrink-0" />
            Disponible
          </span>
        ) : (
          <span className="text-amber-100/80">No descargado</span>
        )}
      </dd>
    </div>
  );
}
