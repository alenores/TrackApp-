"use client";

/**
 * La casilla de tildar de la app: decide si algo se ve o no.
 *
 * Es un botón con forma de casilla, no la casilla del sistema, para que tenga
 * el tamaño y los colores de la app en modo sol y en modo noche. `aMedias`
 * es para el tilde de un grupo con algunas tildadas y otras no.
 */
export function Casilla({ tildada, aMedias = false, etiqueta, alTocar }: { tildada: boolean; aMedias?: boolean; etiqueta: string; alTocar: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={aMedias ? "mixed" : tildada} aria-label={etiqueta} onClick={alTocar}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
      <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${tildada || aMedias ? "border-acento-borde bg-acento-borde text-superficie" : "border-borde-fuerte bg-superficie"}`}>
        {tildada ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
        ) : aMedias ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden><path d="M6 12h12" /></svg>
        ) : null}
      </span>
    </button>
  );
}
