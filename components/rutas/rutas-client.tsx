"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTrackAppData } from "@/app/hooks/useTrackAppData";
import { RutaList } from "@/components/rutas/ruta-list";
import { RutaListSkeleton } from "@/components/rutas/ruta-list-skeleton";

type RutasClientProps = {
  currentUserId: string | null;
  currentUserName: string | null;
};

async function fetchAvatarsClient(
  userIds: string[],
): Promise<Record<string, string | null>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .in("id", uniqueIds);

  if (error || !data) return {};

  const map: Record<string, string | null> = {};
  for (const row of data as { id: string; avatar_url: string | null }[]) {
    map[row.id] = row.avatar_url?.trim() || null;
  }
  return map;
}

export function RutasClient({ currentUserId, currentUserName }: RutasClientProps) {
  const { rutas, loading, estado } = useTrackAppData();
  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (rutas.length === 0) return;
    fetchAvatarsClient(rutas.map((r) => r.user_id)).then(setAvatarByUserId);
  }, [rutas]);

  if (loading) {
    return <RutaListSkeleton showFabSpacer count={3} />;
  }

  if (estado === "sin_datos") {
    return (
      <div className="space-y-4 pb-16">
        <div className="rounded-xl border border-border bg-surface p-6 text-center space-y-2">
          <p className="text-base font-medium text-foreground">Sin datos disponibles</p>
          <p className="text-sm text-muted">
            No hay conexión y no hay datos descargados previamente.
            Conectate a internet para cargar las rutas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {estado === "sin_conexion" && (
        <div className="mb-4 rounded-xl border border-yellow-600/40 bg-yellow-950/30 px-4 py-3">
          <p className="text-sm text-yellow-300 font-medium">
            Sin conexión — mostrando datos guardados
          </p>
        </div>
      )}

      <RutaList
        rutas={rutas}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        avatarByUserId={avatarByUserId}
        showNewRouteFab
      />
    </div>
  );
}
