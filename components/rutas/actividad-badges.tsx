import type { ActividadTipo } from "@/types/database";
import { getActividadMeta } from "@/lib/rutas/actividades";

type ActividadBadgesProps = {
  actividades: ActividadTipo[];
  size?: "sm" | "md";
};

export function ActividadBadges({ actividades, size = "sm" }: ActividadBadgesProps) {
  if (actividades.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {actividades.map((tipo) => {
        const meta = getActividadMeta(tipo);
        return (
          <span
            key={tipo}
            className={
              size === "md"
                ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-950/60 px-3 py-1 text-sm font-medium text-emerald-200"
                : "inline-flex items-center gap-1 rounded-full border border-emerald-700/30 bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-300"
            }
          >
            <span aria-hidden>{meta.icon}</span>
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
