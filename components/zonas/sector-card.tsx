"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSector } from "@/app/actions/delete-sector";
import { triggerTapHaptic } from "@/lib/haptics";
import {
  estimateSectorTileCount,
  formatSectorSize,
  getSectorBbox,
  getSectorZoomLevels,
  DOWNLOAD_CONFIRM_TILES,
} from "@/lib/zonas/helpers";
import {
  downloadSectorOffline,
  deleteOfflineSector,
  isSectorOffline,
} from "@/lib/tiles";
import type { SectorListItem } from "@/types/database";
import type { DownloadProgress } from "@/lib/tiles";
import { Card } from "@/components/ui/card";
import { UploaderAvatar } from "@/components/rutas/uploader-avatar";

const LONG_PRESS_MS = 500;

type SectorCardProps = {
  sector: SectorListItem;
  zonaId: string;
  currentUserId: string | null;
  uploaderLabel: string;
  uploaderAvatarUrl?: string | null;
};

export function SectorCard({
  sector,
  zonaId,
  currentUserId,
  uploaderLabel,
  uploaderAvatarUrl,
}: SectorCardProps) {
  const router = useRouter();
  const isOwner = currentUserId === sector.user_id;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const estimatedTiles = estimateSectorTileCount(sector);

  useEffect(() => {
    isSectorOffline(sector.id).then(setOffline);
  }, [sector.id]);

  const handlePress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (isOwner) {
        triggerTapHaptic();
        setMenuOpen(true);
      }
    }, LONG_PRESS_MS);
  }, [isOwner]);

  const handleRelease = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteSector(sector.id, zonaId);
    if (!result.success) {
      alert(result.error);
      setDeleting(false);
    }
  };

  const startDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    setProgress(null);
    try {
      const bbox = getSectorBbox(sector);
      const zoomLevels = getSectorZoomLevels(sector.zoom_minimo);
      await downloadSectorOffline(
        { id: sector.id, nombre: sector.nombre, bbox },
        zoomLevels,
        (p) => setProgress(p),
      );
      setOffline(true);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Error al descargar.",
      );
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  const handleDownloadClick = () => {
    if (estimatedTiles > DOWNLOAD_CONFIRM_TILES) {
      setShowConfirm(true);
    } else {
      startDownload();
    }
  };

  const handleRemoveOffline = async () => {
    await deleteOfflineSector(sector.id);
    setOffline(false);
  };

  return (
    <>
      <div
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
      >
        <Card tone="light" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {sector.nombre}
                </h3>
                {offline ? (
                  <span className="shrink-0 rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Offline
                  </span>
                ) : null}
              </div>
              {sector.descripcion ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                  {sector.descripcion}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Zoom mínimo: {sector.zoom_minimo}</span>
            <span className="text-slate-700">·</span>
            <span>
              {estimatedTiles} tiles · {formatSectorSize(estimatedTiles)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UploaderAvatar
                avatarUrl={uploaderAvatarUrl}
                uploaderLabel={uploaderLabel}
                size="sm"
              />
              <span className="text-xs text-slate-500">{uploaderLabel}</span>
            </div>

            {offline ? (
              <button
                onClick={handleRemoveOffline}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                Quitar offline
              </button>
            ) : downloading ? (
              <span className="text-xs text-emerald-400">
                {progress
                  ? `${progress.current}/${progress.total} tiles…`
                  : "Iniciando…"}
              </span>
            ) : (
              <button
                onClick={handleDownloadClick}
                className="rounded-lg bg-emerald-700/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-700/50"
              >
                Descargar mapa
              </button>
            )}
          </div>

          {downloadError ? (
            <p className="rounded-xl bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {downloadError}
            </p>
          ) : null}
        </Card>
      </div>

      {menuOpen && isOwner ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-800 p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-medium text-slate-300 pb-2 border-b border-slate-700">
              {sector.nombre}
            </p>
            <button
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-700"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/zonas/${zonaId}/sectores/${sector.id}/editar`);
              }}
            >
              Editar sector
            </button>
            <button
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-950/40"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Eliminando…" : "Eliminar sector"}
            </button>
          </div>
        </div>
      ) : null}

      {showConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground">
              Confirmar descarga
            </h3>
            <p className="text-sm text-slate-300">
              Este sector requiere descargar{" "}
              <strong className="text-foreground">{estimatedTiles} tiles</strong>{" "}
              ({formatSectorSize(estimatedTiles)}). ¿Querés continuar?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700"
                onClick={() => setShowConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                onClick={() => {
                  setShowConfirm(false);
                  startDownload();
                }}
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
