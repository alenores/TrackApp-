"use client";

import { useModo } from "@/hooks/use-modo";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * El botón que cambia entre modo sol y modo noche.
 *
 * **Tiene que estar a un toque desde el mapa.** Se usa caminando: si el sol
 * gira y la pantalla deja de leerse, no se puede pedir que el usuario entre a
 * un menú de ajustes.
 *
 * Tiene el tamaño normal de un botón redondo, también navegando (decisión 024).
 */

type BotonDeModoProps = {
  className?: string;
};

export function BotonDeModo({
  className = "",
}: BotonDeModoProps) {
  const { modo, cambiar } = useModo();
  const vaASol = modo === "noche";

  const tamanoBase = "h-10 w-10";
  const tieneTamanoPersonalizado = /\b(h-|w-)/.test(className);

  return (
    <button
      type="button"
      onClick={cambiar}
      onPointerDown={() => vibrarAlTocar()}
      aria-label={vaASol ? "Pasar al modo sol" : "Pasar al modo noche"}
      title={vaASol ? "Pasar al modo sol" : "Pasar al modo noche"}
      className={[
        CLASE_DE_RESPUESTA_AL_TOQUE,
        "flex shrink-0 items-center justify-center rounded-full border border-borde bg-superficie/90 text-texto-suave shadow-sm backdrop-blur-sm",
        "hover:bg-superficie-alta hover:text-texto",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        tieneTamanoPersonalizado ? "" : tamanoBase,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {vaASol ? (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4Z" />
        </svg>
      )}
    </button>
  );
}
