import type { ReactNode } from "react";
import type { GrupoDeLaLista } from "@/lib/marcas/lista";

/**
 * El ícono de cada clase de marca. **Es el único de la app**: lo usan los
 * grupos de la lista de Marcas y cualquier lugar que nombre una clase.
 * Zona es el mismo de la entrada Zonas del menú.
 */
const DIBUJO: Record<GrupoDeLaLista, ReactNode> = {
  camino: (
    <>
      <path d="M6.3 16.7 8.6 9.5M11.2 8.7 14.4 10.6M17.3 11.9 20.5 6.5" />
      <circle cx="5" cy="19" r="2.6" /><circle cx="9.5" cy="7" r="2.6" /><circle cx="16" cy="12" r="2.6" />
    </>
  ),
  punto: <><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></>,
  trazo: <path d="M7 21c-4-4 9-6 9-10S8 8 12 3" strokeDasharray="4 3" />,
  zona: <><rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="3 2" /><path d="M4 12h16M12 4v16" /></>,
};

export function IconoDeClase({ grupo, className = "h-5 w-5" }: { grupo: GrupoDeLaLista; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden className={className}>
      {DIBUJO[grupo]}
    </svg>
  );
}
