"use client";

import type { CSSProperties } from "react";
import { Enlace } from "@/components/ui/enlace";
import { BotonRedondo, clasesDeBotonRedondo } from "@/components/ui/boton-redondo";

const MAS = <path d="M12 5v14M5 12h14" />;

/** El mismo círculo «+» para todas las acciones de agregar. */
export function BotonAgregar({ etiqueta, href, alTocar, className = "", style, disabled = false }: {
  etiqueta: string;
  href?: string;
  alTocar?: () => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  if (href) return <Enlace href={href} aria-label={etiqueta} title={etiqueta}
    className={clasesDeBotonRedondo("principal", className)} style={style}>
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>{MAS}</svg>
  </Enlace>;
  return <BotonRedondo etiqueta={etiqueta} variante="principal" onClick={alTocar}
    className={className} style={style} disabled={disabled}>{MAS}</BotonRedondo>;
}
