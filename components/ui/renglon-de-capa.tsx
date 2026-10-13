"use client";

import type { ReactNode } from "react";
import { Casilla } from "@/components/ui/casilla";

/**
 * Un renglón para prender o apagar una capa de lo que se mira: la casilla, el
 * nombre, qué muestra y, adentro, lo que solo tiene sentido para esa capa
 * (la actividad y la referencia de los Caminos, las clases de los detalles).
 * Todo el renglón de arriba se toca para prender o apagar.
 *
 * Lo usan «Mostrar» de Consultas y «Qué listar» de Marcas.
 */
export function RenglonDeCapa({ titulo, icono, queMuestra, prendida, aMedias = false, alAlternar, children }: {
  titulo: string;
  /** El ícono de lo que muestra, el mismo que tiene en el resto de la app. */
  icono?: ReactNode;
  queMuestra: string;
  prendida: boolean;
  /** Algo prendido y algo no, como los detalles con solo algunas clases. */
  aMedias?: boolean;
  alAlternar: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-superficie shadow-[var(--sombra)] ${prendida || aMedias ? "border-acento-borde" : "border-borde"}`}>
      <div className="flex items-center gap-2 pl-1 pr-3">
        <Casilla tildada={prendida} aMedias={aMedias} etiqueta={`Mostrar ${titulo}`} alTocar={alAlternar} />
        <button type="button" onClick={alAlternar} aria-hidden tabIndex={-1} className="min-w-0 flex-1 py-2 text-left">
          <span className="flex items-center gap-2 text-base font-semibold text-texto">
            {icono ? <span className="flex shrink-0 items-center gap-0.5 text-texto-suave">{icono}</span> : null}
            {titulo}
          </span>
          <span className="block text-sm text-texto-suave">{queMuestra}</span>
        </button>
      </div>
      {children ? <div className="border-t border-borde px-3 py-3">{children}</div> : null}
    </div>
  );
}
