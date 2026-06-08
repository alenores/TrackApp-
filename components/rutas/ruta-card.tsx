"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteRuta } from "@/app/actions/delete-ruta";
import type { RutaListItem } from "@/types/database";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { triggerTapHaptic } from "@/lib/haptics";
import { deleteOfflineRuta } from "@/lib/tiles";
import { UploaderAvatar } from "@/components/rutas/uploader-avatar";
import { Card } from "@/components/ui/card";

const SWIPE_ACTIVATION_PX = 8;
const SWIPE_THRESHOLD_PX = 72;
const EXIT_ANIMATION_MS = 220;
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 12;

function applySwipeOffset(deltaX: number, cardWidth: number): number {
  const travel = Math.abs(deltaX);
  const freeTravel = cardWidth * 0.85;

  if (travel <= freeTravel) {
    return deltaX;
  }

  const excess = travel - freeTravel;
  const resisted = freeTravel + excess * 0.18;
  return deltaX < 0 ? -resisted : resisted;
}

type RutaCardProps = {
  ruta: RutaListItem;
  uploaderLabel: string;
  uploaderAvatarUrl?: string | null;
  isOwner: boolean;
};

export function RutaCard({
  ruta,
  uploaderLabel,
  uploaderAvatarUrl,
  isOwner,
}: RutaCardProps) {
  const router = useRouter();
  const detailHref = `/rutas/${ruta.id}`;
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const offsetXRef = useRef(0);
  const swiping = useRef(false);
  const didSwipe = useRef(false);
  const longPressTriggered = useRef(false);
  const exitTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateOffset = (nextOffset: number) => {
    offsetXRef.current = nextOffset;
    setOffsetX(nextOffset);
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const goToDetail = () => {
    triggerTapHaptic();
    router.push(detailHref);
  };

  const resetSwipe = () => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    updateOffset(0);
    setIsDragging(false);
    setIsExiting(false);
    swiping.current = false;
  };

  const closeActions = () => {
    setActionsOpen(false);
    setActionError(null);
    longPressTriggered.current = false;
  };

  const openActions = () => {
    if (!isOwner || actionsOpen || isExiting) return;

    longPressTriggered.current = true;
    resetSwipe();
    setActionsOpen(true);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  };

  const scheduleLongPress = () => {
    if (!isOwner || actionsOpen || isExiting) return;

    clearLongPressTimer();
    longPressTimer.current = window.setTimeout(openActions, LONG_PRESS_MS);
  };

  const handlePointerDown = (
    clientX: number,
    clientY: number,
    startSwipe = true,
  ) => {
    if (isExiting || actionsOpen) return;

    startX.current = clientX;
    startY.current = clientY;
    longPressTriggered.current = false;

    if (startSwipe) {
      swiping.current = true;
      didSwipe.current = false;
      setIsDragging(true);
    }

    scheduleLongPress();
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (actionsOpen || isExiting) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    if (
      Math.abs(deltaX) > LONG_PRESS_MOVE_TOLERANCE_PX ||
      Math.abs(deltaY) > LONG_PRESS_MOVE_TOLERANCE_PX
    ) {
      clearLongPressTimer();
    }

    if (!swiping.current) return;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsDragging(false);
      updateOffset(0);
      swiping.current = false;
      return;
    }

    if (deltaX > -SWIPE_ACTIVATION_PX) {
      updateOffset(0);
      return;
    }

    const cardWidth = cardRef.current?.offsetWidth ?? 320;
    updateOffset(applySwipeOffset(deltaX, cardWidth));
  };

  const handlePointerUp = () => {
    clearLongPressTimer();

    if (longPressTriggered.current || actionsOpen) {
      swiping.current = false;
      setIsDragging(false);
      return;
    }

    if (!swiping.current || isExiting) return;

    const currentOffset = offsetXRef.current;
    const cardWidth = cardRef.current?.offsetWidth ?? 320;
    const threshold = Math.max(
      SWIPE_THRESHOLD_PX,
      Math.round(cardWidth * 0.22),
    );

    setIsDragging(false);
    swiping.current = false;

    if (currentOffset <= -threshold) {
      didSwipe.current = true;
      setIsExiting(true);
      updateOffset(-window.innerWidth);

      exitTimer.current = window.setTimeout(() => {
        exitTimer.current = null;
        goToDetail();
      }, EXIT_ANIMATION_MS);
      return;
    }

    updateOffset(0);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    handlePointerDown(touch.clientX, touch.clientY, true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handlePointerUp();
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    handlePointerDown(event.clientX, event.clientY, false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!longPressTimer.current && !swiping.current) return;
    handlePointerMove(event.clientX, event.clientY);
  };

  const handleMouseUp = () => {
    handlePointerUp();
  };

  const handleMouseLeave = () => {
    clearLongPressTimer();
  };

  const handleClick = () => {
    if (actionsOpen || longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }

    goToDetail();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (actionsOpen) return;
      goToDetail();
    }
  };

  const handleEdit = () => {
    closeActions();
    router.push(`/rutas/${ruta.id}/editar`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Eliminar esta ruta? Esta acción no se puede deshacer.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError(null);

    try {
      await deleteOfflineRuta(ruta.id);
    } catch {
      // Offline data may not exist.
    }

    const result = await deleteRuta(ruta.id);

    if (!result.success) {
      setActionError(result.error);
      setDeleting(false);
      return;
    }

    closeActions();
    setDeleting(false);
    router.refresh();
  };

  useEffect(() => {
    if (!actionsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeActions();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [actionsOpen]);

  const revealProgress = Math.min(
    1,
    Math.abs(offsetX) / Math.max(SWIPE_THRESHOLD_PX, 1),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-emerald-950/70 px-5"
        style={{ opacity: actionsOpen ? 0 : revealProgress * 0.95 }}
      >
        <span
          className="text-sm font-medium text-emerald-200"
          style={{
            transform: `translateX(${(1 - revealProgress) * 12}px)`,
            opacity: revealProgress,
          }}
        >
          Ver ruta
        </span>
      </div>

      <div
        ref={cardRef}
        role="link"
        tabIndex={0}
        aria-label={`Ver ruta ${ruta.nombre}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          clearLongPressTimer();
          resetSwipe();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(event) => {
          if (isOwner) {
            event.preventDefault();
            openActions();
          }
        }}
        style={{ transform: `translateX(${offsetX}px)` }}
        className={[
          "relative rounded-2xl touch-pan-y select-none",
          !isDragging ? "transition-transform duration-200 ease-out" : "",
          actionsOpen ? "z-20" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Card
          interactive={!actionsOpen}
          className={[
            "space-y-3",
            actionsOpen ? "ring-2 ring-emerald-500/50" : "",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{ruta.nombre}</h2>
              {ruta.descripcion ? (
                <p className="line-clamp-2 break-words whitespace-pre-wrap text-sm leading-6 text-slate-400">
                  {ruta.descripcion}
                </p>
              ) : null}
            </div>
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/80 text-slate-400"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Distancia</dt>
              <dd className="font-medium text-emerald-200">
                {formatDistanceKm(ruta.distancia_km)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Subida por</dt>
              <dd className="font-medium text-foreground">{uploaderLabel}</dd>
              <UploaderAvatar
                avatarUrl={uploaderAvatarUrl}
                uploaderLabel={uploaderLabel}
                size="sm"
              />
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Fecha</dt>
              <dd className="font-medium text-foreground">
                {formatRouteDate(ruta.created_at)}
              </dd>
            </div>
          </dl>

          <p className="text-xs font-medium text-slate-500">
            {isOwner
              ? "Tocá para ver · Mantené presionado para editar o eliminar"
              : "Tocá para ver detalle"}
          </p>

          {actionError ? (
            <p role="alert" className="text-sm text-red-400">
              {actionError}
            </p>
          ) : null}
        </Card>

        {actionsOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar acciones"
              className="absolute inset-0 z-10 rounded-2xl bg-slate-950/50"
              onClick={(event) => {
                event.stopPropagation();
                closeActions();
              }}
            />

            <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={(event) => {
                  event.stopPropagation();
                  handleEdit();
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-sky-600/50 bg-sky-900/90 px-5 py-3 text-sm font-semibold text-sky-100 shadow-lg shadow-black/30 transition-transform hover:scale-105 active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path
                    d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5.5a1.4 1.4 0 0 0-2 0L4 16v4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                Editar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete();
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-red-700/50 bg-red-950/90 px-5 py-3 text-sm font-semibold text-red-200 shadow-lg shadow-black/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5h6v2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
