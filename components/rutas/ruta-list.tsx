import Link from "next/link";
import type { Ruta } from "@/types/database";
import { getUploaderLabel } from "@/lib/rutas/helpers";
import { RutaCard } from "@/components/rutas/ruta-card";
import { Card } from "@/components/ui/card";

type RutaListProps = {
  rutas: Ruta[];
  currentUserId: string | null;
  currentUserEmail: string | null;
  title?: string;
  showWelcome?: boolean;
};

export function RutaList({
  rutas,
  currentUserId,
  currentUserEmail,
  title = "Rutas disponibles",
  showWelcome = false,
}: RutaListProps) {
  return (
    <div className="space-y-4">
      {showWelcome ? (
        <Card accent>
          <h1 className="text-xl font-bold text-foreground">
            Bienvenido a TrackApp
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Explorá rutas GPX compartidas por la comunidad.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted">
            {rutas.length === 0
              ? "Todavía no hay rutas cargadas."
              : `${rutas.length} ruta${rutas.length === 1 ? "" : "s"} disponible${rutas.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/rutas/nueva"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-emerald-700/50 bg-accent-light px-5 py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
        >
          Nueva ruta
        </Link>
      </div>

      {rutas.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-slate-400">
            Sé el primero en subir una ruta GPX para compartirla con otros
            usuarios.
          </p>
          <Link
            href="/rutas/nueva"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-700/50 bg-accent-light px-5 py-3 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent sm:w-auto"
          >
            Subir primera ruta
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rutas.map((ruta) => (
            <li key={ruta.id}>
              <RutaCard
                ruta={ruta}
                uploaderLabel={getUploaderLabel(
                  ruta,
                  currentUserId,
                  currentUserEmail,
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
