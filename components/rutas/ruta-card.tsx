"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { RutaListItem } from "@/types/database";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { Card } from "@/components/ui/card";

const SWIPE_ACTIVATION_PX = 8;
const SWIPE_THRESHOLD_PX = 72;
const EXIT_ANIMATION_MS = 220;

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
};

export function RutaCard({ ruta, uploaderLabel }: RutaCardProps) {
  const router = useRouter();
  const detailHref = `/rutas/${ruta.id}`;
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const offsetXRef = useRef(0);
  const swiping = useRef(false);
  const didSwipe = useRef(false);
  const exitTimer = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const updateOffset = (nextOffset: number) => {
    offsetXRef.current = nextOffset;
    setOffsetX(nextOffset);
  };

  const goToDetail = () => {
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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isExiting) return;

    const touch = event.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    swiping.current = true;
    didSwipe.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swiping.current || isExiting) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

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

  const handleTouchEnd = () => {
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

  const handleClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }

    goToDetail();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToDetail();
    }
  };

  const revealProgress = Math.min(
    1,
    Math.abs(offsetX) / Math.max(SWIPE_THRESHOLD_PX, 1),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-emerald-950/70 px-5"
        style={{ opacity: revealProgress * 0.95 }}
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
        onTouchCancel={resetSwipe}
        style={{ transform: `translateX(${offsetX}px)` }}
        className={[
          "relative rounded-2xl touch-pan-y",
          !isDragging ? "transition-transform duration-200 ease-out" : "",
          isDragging && !isExiting ? "active:scale-[0.995]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Card className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{ruta.nombre}</h2>
            {ruta.descripcion ? (
              <p className="text-sm leading-6 text-slate-400">{ruta.descripcion}</p>
            ) : null}
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
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Fecha</dt>
              <dd className="font-medium text-foreground">
                {formatRouteDate(ruta.created_at)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
