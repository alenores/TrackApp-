import { mostrarActividad } from "@/lib/rutas/actividades";
import type { ActividadRuta } from "@/types/database";

/**
 * Los tipos de actividad de una ruta.
 *
 * Los íconos son dibujos y no emoji: un emoji no respeta el contraste ni el
 * tamaño que pide la app, y con sol de frente se pierde.
 */

type Props = {
  actividades: ActividadRuta[];
  tamano?: "chico" | "mediano";
};

export function ActividadBadges({ actividades, tamano = "chico" }: Props) {
  if (actividades.length === 0) return null;

  const mediano = tamano === "mediano";

  return (
    <div className="flex flex-wrap gap-1.5">
      {actividades.map((tipo) => {
        const actividad = mostrarActividad(tipo);

        return (
          <span
            key={tipo}
            className={
              mediano
                ? "inline-flex items-center gap-1.5 rounded-full border border-acento-borde bg-verde-fondo px-3 py-1 text-sm font-medium text-verde-texto"
                : "inline-flex items-center gap-1 rounded-full border border-acento-borde bg-verde-fondo px-2 py-0.5 text-xs font-medium text-acento-tenue"
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={mediano ? "h-4 w-4" : "h-3.5 w-3.5"}
            >
              <path
                d={actividad.trazo}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {actividad.etiqueta}
          </span>
        );
      })}
    </div>
  );
}
