import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { getUploaderLabel } from "@/lib/rutas/helpers";
import { fetchRutaById } from "@/lib/rutas/queries";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { RouteMapLoader } from "@/components/map/route-map-loader";
import { RutaOfflineActions } from "@/components/rutas/ruta-offline-actions";
import { RutaOfflineBadge } from "@/components/rutas/ruta-offline-badge";
import { Card } from "@/components/ui/card";

type RutaDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RutaDetailPage({ params }: RutaDetailPageProps) {
  const { id } = await params;
  const [user, ruta] = await Promise.all([getAuthUser(), fetchRutaById(id)]);

  if (!ruta) {
    notFound();
  }

  const uploaderLabel = getUploaderLabel(
    ruta,
    user?.id ?? null,
    getUserDisplayName(user),
  );

  if (!ruta.geojson || !ruta.bbox) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card tone="light" className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-foreground">
              {ruta.nombre}
            </h1>
            {ruta.descripcion ? (
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {ruta.descripcion}
              </p>
            ) : null}
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm text-emerald-300 hover:text-emerald-200"
          >
            ← Volver
          </Link>
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
          <div className="col-span-2">
            <RutaOfflineBadge rutaId={ruta.id} />
          </div>
        </dl>
      </Card>

      <Card className="space-y-3 p-0 overflow-hidden">
        <RouteMapLoader
          geojson={ruta.geojson}
          bbox={ruta.bbox}
          className="h-72 rounded-none border-0 sm:h-96"
        />
      </Card>

      <RutaOfflineActions
        rutaId={ruta.id}
        nombre={ruta.nombre}
        geojson={ruta.geojson}
        bbox={ruta.bbox}
      />
    </div>
  );
}
