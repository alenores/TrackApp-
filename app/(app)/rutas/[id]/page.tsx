import { notFound } from "next/navigation";
import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { fetchAvatarUrlsByUserIds } from "@/lib/auth/profiles";
import { getUploaderLabel } from "@/lib/rutas/helpers";
import { fetchRutaById } from "@/lib/rutas/queries";
import {
  RUTA_DATA_CELL_CLASS,
  RUTA_DATA_GRID_CLASS,
  RUTA_DATA_LABEL_CLASS,
  RUTA_DATA_VALUE_CLASS,
  RUTA_DISTANCE_VALUE_CLASS,
} from "@/lib/rutas/data-cell-styles";
import { UploaderAvatar } from "@/components/rutas/uploader-avatar";
import { RutaOfflineField } from "@/components/rutas/ruta-offline-field";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { RouteMapLoader } from "@/components/map/route-map-loader";
import { RutaOfflineActions } from "@/components/rutas/ruta-offline-actions";
import { RutaDetailBackLink } from "@/components/rutas/ruta-detail-back-link";
import { ActividadBadges } from "@/components/rutas/actividad-badges";
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
  const uploaderAvatars = await fetchAvatarUrlsByUserIds([ruta.user_id]);
  const uploaderAvatarUrl = uploaderAvatars[ruta.user_id] ?? null;

  if (!ruta.geojson || !ruta.bbox) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card tone="light" className="space-y-3">
        <div className="flex items-start gap-3">
          <RutaDetailBackLink />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-foreground">
              {ruta.nombre}
            </h1>
          </div>
        </div>

        {ruta.descripcion ? (
          <p className="break-words whitespace-pre-wrap text-sm leading-6 text-slate-400">
            {ruta.descripcion}
          </p>
        ) : null}

        <ActividadBadges actividades={ruta.actividades} size="md" />

        <dl className={RUTA_DATA_GRID_CLASS}>
          <div className={RUTA_DATA_CELL_CLASS}>
            <dt className={RUTA_DATA_LABEL_CLASS}>Distancia</dt>
            <dd className={RUTA_DISTANCE_VALUE_CLASS}>
              {formatDistanceKm(ruta.distancia_km)}
            </dd>
          </div>
          <div className={RUTA_DATA_CELL_CLASS}>
            <dt className={RUTA_DATA_LABEL_CLASS}>Subida por</dt>
            <dd className={RUTA_DATA_VALUE_CLASS}>{uploaderLabel}</dd>
            <UploaderAvatar
              avatarUrl={uploaderAvatarUrl}
              uploaderLabel={uploaderLabel}
            />
          </div>
          <div className={RUTA_DATA_CELL_CLASS}>
            <dt className={RUTA_DATA_LABEL_CLASS}>Fecha</dt>
            <dd className={RUTA_DATA_VALUE_CLASS}>
              {formatRouteDate(ruta.created_at)}
            </dd>
          </div>
          <RutaOfflineField rutaId={ruta.id} />
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
