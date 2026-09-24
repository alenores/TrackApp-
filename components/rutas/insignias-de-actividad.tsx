import { mostrarActividad } from "@/lib/rutas/actividades";
import type { ActividadRuta } from "@/types/database";

/**
 * Los tipos de actividad de una ruta.
 *
 * Los íconos son dibujos y no emoji: un emoji no respeta el contraste ni el
 * tamaño que pide la app, y con sol de frente se pierde.
 *
 * La misma insignia se usa en el filtro de rutas: prendida se ve igual que en
 * la tarjeta, apagada queda en gris.
 */

type Tamano = "chico" | "mediano";

type InsigniaProps = {
  tipo: ActividadRuta;
  tamano?: Tamano;
  apagada?: boolean;
};

const CLASES_POR_TAMANO: Record<Tamano, string> = {
  chico: "gap-1 px-2 py-0.5 text-xs",
  mediano: "gap-1.5 px-3 py-1 text-sm",
};

const CLASES_DE_COLOR = {
  chico: "border-acento-borde bg-verde-fondo text-acento-tenue",
  mediano: "border-acento-borde bg-verde-fondo text-verde-texto",
  apagada: "border-borde-fuerte bg-transparent text-texto-suave",
};

export function InsigniaDeActividad({ tipo, tamano = "chico", apagada = false }: InsigniaProps) {
  const actividad = mostrarActividad(tipo);

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-medium",
        CLASES_POR_TAMANO[tamano],
        apagada ? CLASES_DE_COLOR.apagada : CLASES_DE_COLOR[tamano],
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={tamano === "mediano" ? "h-4 w-4" : "h-3.5 w-3.5"}
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
}

type Props = {
  actividades: ActividadRuta[];
  tamano?: Tamano;
};

export function InsigniasDeActividad({ actividades, tamano = "chico" }: Props) {
  if (actividades.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {actividades.map((tipo) => (
        <InsigniaDeActividad key={tipo} tipo={tipo} tamano={tamano} />
      ))}
    </div>
  );
}
