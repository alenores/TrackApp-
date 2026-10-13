"use client";

import type { ReactNode } from "react";

/**
 * Una opción para elegir adentro de una ventana emergente: el renglón entero
 * se toca. Lo usan «Agregar una marca» y «Descargar todo» de una zona.
 */
export function OpcionDeEmergente({ icono, titulo, detalle, alTocar, deshabilitada = false }: {
  icono?: ReactNode;
  titulo: string;
  detalle: string;
  alTocar: () => void;
  deshabilitada?: boolean;
}) {
  return (
    <button type="button" onClick={alTocar} disabled={deshabilitada}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2 text-left shadow-[var(--sombra)] hover:border-acento-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-borde">
      {icono ? <span className="shrink-0 text-texto-suave">{icono}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-semibold text-texto">{titulo}</span>
        <span className="text-sm leading-5 text-texto-suave">{detalle}</span>
      </span>
    </button>
  );
}
