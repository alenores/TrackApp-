import Link from "next/link";
import type { Ruta } from "@/types/database";
import { formatDistanceKm, formatRouteDate } from "@/lib/gpx";
import { Card } from "@/components/ui/card";

type RutaCardProps = {
  ruta: Ruta;
  uploaderLabel: string;
};

export function RutaCard({ ruta, uploaderLabel }: RutaCardProps) {
  return (
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

      <Link
        href={`/rutas/${ruta.id}`}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-sky-600/50 bg-sky-950/50 px-5 py-3 text-base font-semibold text-sky-100 transition-colors hover:bg-sky-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
      >
        Ver ruta
      </Link>
    </Card>
  );
}
