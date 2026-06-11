"use client";

import Link from "next/link";
import type { ZonaListItem } from "@/types/database";
import { getZonaUploaderLabel } from "@/lib/zonas/labels";
import { ZonaCard } from "@/components/zonas/zona-card";

type ZonaListProps = {
  zonas: ZonaListItem[];
  currentUserId: string | null;
  currentUserName: string | null;
  avatarByUserId?: Record<string, string | null>;
};

export function ZonaList({
  zonas,
  currentUserId,
  currentUserName,
  avatarByUserId = {},
}: ZonaListProps) {
  const byProvincia = zonas.reduce<Record<string, ZonaListItem[]>>((acc, zona) => {
    if (!acc[zona.provincia]) acc[zona.provincia] = [];
    acc[zona.provincia].push(zona);
    return acc;
  }, {});

  const provincias = Object.keys(byProvincia).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Zonas</h1>
        <Link
          href="/zonas/nueva"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-700/50 bg-accent-light px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent"
        >
          + Nueva
        </Link>
      </div>

      {zonas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-slate-400">
          <p className="text-base font-medium">No hay zonas cargadas aún.</p>
          <p className="mt-1 text-sm">
            Creá la primera zona para organizar los sectores de escalada.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {provincias.map((provincia) => (
            <div key={provincia} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                {provincia}
              </h2>
              <div className="space-y-3">
                {byProvincia[provincia].map((zona) => (
                  <ZonaCard
                    key={zona.id}
                    zona={zona}
                    currentUserId={currentUserId}
                    uploaderLabel={getZonaUploaderLabel(
                      zona,
                      currentUserId,
                      currentUserName,
                    )}
                    uploaderAvatarUrl={avatarByUserId[zona.user_id]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
