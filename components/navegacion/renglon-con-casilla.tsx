"use client";

import type { ReactNode } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * Un renglón con casilla, para prender y apagar lo que se ve en el mapa.
 *
 * Se toca el renglón entero, no solo la casilla. Tamaño normal (decisión 024). Lo usan la elección de rutas y la de anotaciones del mapa.
 */

type Props = {
  prendido: boolean;
  alTocar: () => void;
  /** Algo que ayuda a reconocerlo antes del texto: el color de la ruta, un ícono. */
  muestra?: ReactNode;
  children: ReactNode;
};

export function RenglonConCasilla({ prendido, alTocar, muestra, children }: Props) {
  return (
    <li className="border-b border-borde last:border-b-0">
      <button
        type="button"
        aria-pressed={prendido}
        onPointerDown={() => vibrarAlTocar()}
        onClick={alTocar}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex min-h-10 w-full items-center gap-3 px-3 py-2 text-left text-lg text-texto",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-acento-borde",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2",
            prendido ? "border-acento-borde bg-acento text-acento-texto" : "border-borde-fuerte",
          ].join(" ")}
        >
          {prendido ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        {muestra}
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </button>
    </li>
  );
}
