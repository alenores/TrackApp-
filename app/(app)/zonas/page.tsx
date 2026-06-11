import Link from "next/link";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchAvatarUrlsByUserIds } from "@/lib/auth/profiles";
import { fetchZonasList } from "@/lib/zonas/queries";
import { getZonaUploaderLabel } from "@/lib/zonas/helpers";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { ZonaCard } from "@/components/zonas/zona-card";
import { Button } from "@/components/ui/button";

export default async function ZonasPage() {
  const [user, zonas] = await Promise.all([getAuthUser(), fetchZonasList()]);

  const userIds = [...new Set(zonas.map((z) => z.user_id))];
  const avatarByUserId = await fetchAvatarUrlsByUserIds(userIds);

  const currentUserId = user?.id ?? null;
  const currentUserName = getUserDisplayName(user);

  // Agrupar por provincia
  const byProvincia = zonas.reduce<Record<string, typeof zonas>>(
    (acc, zona) => {
      if (!acc[zona.provincia]) acc[zona.provincia] = [];
      acc[zona.provincia].push(zona);
      return acc;
    },
    {},
  );

  const provincias = Object.keys(byProvincia).sort();

  return (
    <>
      <AppReadyMarker />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Zonas</h1>
          <Link href="/zonas/nueva">
            <Button size="sm">+ Nueva</Button>
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
    </>
  );
}
