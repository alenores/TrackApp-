"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Ruta } from "@/types/database";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { Card } from "@/components/ui/card";

const SWIPE_THRESHOLD_PX = 72;
const SWIPE_MAX_PX = 112;

type RutaCardProps = {
  ruta: Ruta;
  uploaderLabel: string;
  selected: boolean;
  onSelect: () => void;
};

export function RutaCard({
  ruta,
  uploaderLabel,
  selected,
  onSelect,
}: RutaCardProps) {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);
  const [offsetX, setOffsetX] = useState(0);

  const resetSwipe = () => {
    setOffsetX(0);
    swiping.current = false;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!selected) return;

    const touch = event.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    swiping.current = true;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!selected || !swiping.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      resetSwipe();
      return;
    }

    if (deltaX > 8) {
      event.preventDefault();
      setOffsetX(Math.min(deltaX, SWIPE_MAX_PX));
    }
  };

  const handleTouchEnd = () => {
    if (!selected) return;

    if (offsetX >= SWIPE_THRESHOLD_PX) {
      router.push(`/rutas/${ruta.id}`);
    }

    resetSwipe();
  };

  const handleClick = () => {
    if (offsetX > 8) return;
    onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }

    if (selected && event.key === "ArrowRight") {
      router.push(`/rutas/${ruta.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Ruta ${ruta.nombre}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetSwipe}
      style={{ transform: offsetX ? `translateX(${offsetX}px)` : undefined }}
      className={[
        "rounded-2xl transition-[transform,box-shadow] duration-150 ease-out touch-pan-y",
        selected
          ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-slate-950"
          : "active:scale-[0.99]",
      ].join(" ")}
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

        {selected ? (
          <p className="text-xs text-muted">Deslizá a la derecha para ver la ruta</p>
        ) : null}
      </Card>
    </div>
  );
}
