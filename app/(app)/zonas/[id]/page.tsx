import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchAvatarUrlsByUserIds } from "@/lib/auth/profiles";
import { fetchZonaById, fetchSectoresByZonaId } from "@/lib/zonas/queries";
import { getZonaUploaderLabel } from "@/lib/zonas/helpers";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploaderAvatar } from "@/components/rutas/uploader-avatar";
import { SectorCard } from "@/components/zonas/sector-card";

type ZonaDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ZonaDetailPage({ params }: ZonaDetailPageProps) {
  const { id } = await params;

  const [user, zona, sectores] = await Promise.all([
    getAuthUser(),
    fetchZonaById(id),
    fetchSectoresByZonaId(id),
  ]);

  if (!zona) notFound();

  const currentUserId = user?.id ?? null;
  const currentUserName = getUserDisplayName(user);

  const allUserIds = [
    zona.user_id,
    ...sectores.map((s) => s.user_id),
  ];
  const avatarByUserId = await fetchAvatarUrlsByUserIds([
    ...new Set(allUserIds),
  ]);

  const zonaUploaderLabel = getZonaUploaderLabel(
    zona,
    currentUserId,
    currentUserName,
  );

  return (
    <>
      <AppReadyMarker />
      <div className="space-y-4">
        <Card tone="light" className="space-y-3">
          <div className="flex items-start gap-3">
            <Link
              href="/zonas"
              className="mt-1 shrink-0 text-slate-400 hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                aria-hidden
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                {zona.provincia}
              </p>
              <h1 className="mt-0.5 break-words text-xl font-bold text-foreground">
                {zona.nombre}
              </h1>
            </div>
          </div>

          {zona.descripcion ? (
            <p className="break-words whitespace-pre-wrap text-sm leading-6 text-slate-400">
              {zona.descripcion}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <UploaderAvatar
              avatarUrl={avatarByUserId[zona.user_id]}
              uploaderLabel={zonaUploaderLabel}
              size="sm"
            />
            <span className="text-xs text-slate-500">{zonaUploaderLabel}</span>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Sectores{" "}
              <span className="text-slate-500 font-normal">
                ({sectores.length})
              </span>
            </h2>
            <Link href={`/zonas/${id}/sectores/nueva`}>
              <Button className="min-h-10 px-4 py-2 text-sm">+ Nuevo sector</Button>
            </Link>
          </div>

          {sectores.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-slate-400">
              <p className="text-sm">No hay sectores en esta zona aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sectores.map((sector) => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  zonaId={id}
                  currentUserId={currentUserId}
                  uploaderLabel={getZonaUploaderLabel(
                    sector,
                    currentUserId,
                    currentUserName,
                  )}
                  uploaderAvatarUrl={avatarByUserId[sector.user_id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
