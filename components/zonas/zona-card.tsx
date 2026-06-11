"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteZona } from "@/app/actions/delete-zona";
import { triggerTapHaptic } from "@/lib/haptics";
import type { ZonaListItem } from "@/types/database";
import { Card } from "@/components/ui/card";
import { UploaderAvatar } from "@/components/rutas/uploader-avatar";

const LONG_PRESS_MS = 500;

type ZonaCardProps = {
  zona: ZonaListItem;
  currentUserId: string | null;
  uploaderLabel: string;
  uploaderAvatarUrl?: string | null;
};

export function ZonaCard({
  zona,
  currentUserId,
  uploaderLabel,
  uploaderAvatarUrl,
}: ZonaCardProps) {
  const router = useRouter();
  const isOwner = currentUserId === zona.user_id;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    const result = await deleteZona(zona.id);
    if (!result.success) {
      alert(result.error);
      setDeleting(false);
    }
  };

  return (
    <>
      <Link
        href={`/zonas/${zona.id}`}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        className="block"
      >
        <Card interactive>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                {zona.provincia}
              </p>
              <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">
                {zona.nombre}
              </h3>
              {zona.descripcion ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                  {zona.descripcion}
                </p>
              ) : null}
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mt-1 h-5 w-5 shrink-0 text-slate-500"
              aria-hidden
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <UploaderAvatar
              avatarUrl={uploaderAvatarUrl}
              uploaderLabel={uploaderLabel}
              size="sm"
            />
            <span className="text-xs text-slate-500">{uploaderLabel}</span>
          </div>
        </Card>
      </Link>

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
              {zona.nombre}
            </p>
            <button
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-200 hover:bg-slate-700"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/zonas/${zona.id}/editar`);
              }}
            >
              Editar zona
            </button>
            <button
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-950/40"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Eliminando…" : "Eliminar zona"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
