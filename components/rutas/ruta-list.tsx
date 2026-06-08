import type { RutaListItem } from "@/types/database";
import { getUploaderLabel } from "@/lib/rutas/helpers";
import { RutaCard } from "@/components/rutas/ruta-card";
import { NuevaRutaFab } from "@/components/rutas/nueva-ruta-fab";
import { Card } from "@/components/ui/card";

type RutaListProps = {
  rutas: RutaListItem[];
  currentUserId: string | null;
  currentUserName: string | null;
  title?: string;
  showNewRouteFab?: boolean;
};

export function RutaList({
  rutas,
  currentUserId,
  currentUserName,
  title = "Rutas disponibles",
  showNewRouteFab = false,
}: RutaListProps) {
  return (
    <div className={`space-y-4 ${showNewRouteFab ? "pb-16" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">
          {rutas.length === 0
            ? "Todavía no hay rutas cargadas."
            : `${rutas.length} ruta${rutas.length === 1 ? "" : "s"} disponible${rutas.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {rutas.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-slate-400">
            {showNewRouteFab
              ? "Sé el primero en subir una ruta GPX. Tocá el botón + abajo a la derecha."
              : "Sé el primero en subir una ruta GPX para compartirla con otros usuarios."}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rutas.map((ruta) => (
            <li key={ruta.id}>
              <RutaCard
                ruta={ruta}
                isOwner={currentUserId === ruta.user_id}
                uploaderLabel={getUploaderLabel(
                  ruta,
                  currentUserId,
                  currentUserName,
                )}
              />
            </li>
          ))}
        </ul>
      )}

      {showNewRouteFab ? <NuevaRutaFab /> : null}
    </div>
  );
}
