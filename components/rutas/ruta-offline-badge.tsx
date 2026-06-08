"use client";

import { useCallback, useEffect, useState } from "react";
import { isRutaOffline } from "@/lib/tiles";
import { RUTA_OFFLINE_UPDATED_EVENT } from "@/lib/rutas/offline-events";

type RutaOfflineBadgeProps = {
  rutaId: string;
};

export function RutaOfflineBadge({ rutaId }: RutaOfflineBadgeProps) {
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

  if (checking || !isOffline) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="h-4 w-4 shrink-0"
      >
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
      <span>Ruta disponible offline</span>
    </div>
  );
}
