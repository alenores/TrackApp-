import { mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { CIRCULOS_DE_TECNICA, circulosDeDificultad } from "@/lib/rutas/filtros";
import type { NivelEsfuerzo } from "@/types/database";

/**
 * Cómo se dibuja qué tan exigente es una ruta: los circulitos de la dificultad
 * técnica y el velocímetro del esfuerzo.
 *
 * Los usan la tarjeta, el detalle y el filtro, así la persona reconoce en el
 * filtro exactamente lo mismo que ve en cada ruta. Los colores salen de las
 * variables de cada modo.
 */

/** El color de cada nivel de esfuerzo, de verde a rojo fuerte. */
export const CLASE_DE_COLOR_DE_ESFUERZO: Record<NivelEsfuerzo, string> = {
  bajo: "text-esfuerzo-bajo",
  medio: "text-esfuerzo-medio",
  alto: "text-esfuerzo-alto",
  muy_alto: "text-esfuerzo-muy-alto",
};

const POSICION_DE_LA_AGUJA: Record<NivelEsfuerzo, number> = {
  bajo: 0,
  medio: 1,
  alto: 2,
  muy_alto: 3,
};

/** Solo el dibujo del velocímetro. Toma el color del texto que lo rodea. */
export function DibujoDeVelocimetro({
  esfuerzo,
  className = "h-4 w-8",
}: {
  esfuerzo: NivelEsfuerzo;
  className?: string;
}) {
  const angulo = ((-90 + (POSICION_DE_LA_AGUJA[esfuerzo] / 3) * 180) * Math.PI) / 180;
  const puntaX = 18 + 13 * Math.sin(angulo);
  const puntaY = 18 - 13 * Math.cos(angulo);

  return (
    <svg viewBox="0 0 36 20" fill="none" className={className} aria-hidden>
      <path
        d="M3 18a15 15 0 0 1 30 0"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="18"
        x2={puntaX.toFixed(1)}
        y2={puntaY.toFixed(1)}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function VelocimetroEsfuerzo({ esfuerzo }: { esfuerzo: NivelEsfuerzo | null }) {
  if (!esfuerzo) return <span className="text-sm font-medium text-texto">—</span>;

  const etiqueta = mostrarEsfuerzo(esfuerzo);

  return (
    <div
      className={`flex flex-col items-center ${CLASE_DE_COLOR_DE_ESFUERZO[esfuerzo]}`}
      aria-label={`Esfuerzo ${etiqueta.toLowerCase()}`}
    >
      <DibujoDeVelocimetro esfuerzo={esfuerzo} />
      <span className="mt-0.5 text-[9px] font-medium">{etiqueta}</span>
    </div>
  );
}

/** Un circulito de la dificultad técnica, lleno o vacío. */
export function CirculoDeTecnica({
  lleno,
  className = "h-2 w-2",
}: {
  lleno: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`block rounded-full border-2 border-tecnica ${lleno ? "bg-tecnica" : "bg-transparent"} ${className}`}
    />
  );
}

export function IndicadorTecnica({ tecnica }: { tecnica: number | null }) {
  if (tecnica === null) return <span className="text-sm font-medium text-texto">—</span>;

  const llenos = circulosDeDificultad(tecnica);

  return (
    <div className="flex h-5 items-center gap-0.5" aria-label={`Técnica ${tecnica} de 10`}>
      {Array.from({ length: CIRCULOS_DE_TECNICA }).map((_, i) => (
        <CirculoDeTecnica key={i} lleno={i < llenos} />
      ))}
    </div>
  );
}
