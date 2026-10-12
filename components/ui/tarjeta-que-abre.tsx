"use client";

import type { ReactNode } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";

export function MarcaDeApertura({ sobreFoto = false }: { sobreFoto?: boolean }) {
  return <span className={`absolute bottom-3 right-4 text-xs font-medium ${sobreFoto ? "text-sobre-foto-texto" : "text-texto-suave"}`}>Abrir ↗</span>;
}

/** Toda la tarjeta abre su ficha; la indicación queda discreta abajo a la derecha. */
export function TarjetaQueAbre({ etiqueta, alAbrir, children, className = "", sobreFoto = false }: {
  etiqueta: string;
  alAbrir: () => void;
  children: ReactNode;
  className?: string;
  sobreFoto?: boolean;
}) {
  return <div role="button" tabIndex={0} aria-label={etiqueta} onClick={alAbrir}
    onKeyDown={(evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        alAbrir();
      }
    }} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
    <Tarjeta interactiva className={`relative pb-9 ${className}`}>
      {children}
      <MarcaDeApertura sobreFoto={sobreFoto} />
    </Tarjeta>
  </div>;
}
