"use client";

import Link from "next/link";
import { BotonDeModo } from "@/components/ui/boton-de-modo";

export function Encabezado() {
  return (
    <header className="z-30 shrink-0 border-b border-borde bg-fondo lg:hidden">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-borde bg-superficie text-verde-texto transition-colors hover:bg-superficie-alta"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path
              d="M4 18 8 6l4 8 4-5 4 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-bold tracking-tight text-texto">
            TrackApp
          </p>
        </div>

        <BotonDeModo className="h-10 w-10 shrink-0" />
      </div>
    </header>
  );
}
