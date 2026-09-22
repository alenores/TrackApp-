"use client";

import Link from "next/link";
import { BotonDeModo } from "@/components/ui/boton-de-modo";

export function Encabezado() {
  return (
    <header className="relative z-30 shrink-0 border-b border-borde overflow-hidden lg:hidden">
      {/* Foto fija de las Sierras de Córdoba descargada en el proyecto */}
      <img
        src="/sierras-encabezado.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-fondo/75 backdrop-blur-[1px]" />

      <div className="relative flex min-h-16 items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <Link
          href="/"
          aria-label="Ir al inicio"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-borde/70 bg-superficie/80 text-verde-texto shadow-sm backdrop-blur-md transition-colors hover:bg-superficie"
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
          <p className="truncate text-lg font-extrabold tracking-wide text-texto drop-shadow-sm uppercase">
            TrackApp
          </p>
        </div>

        <BotonDeModo className="h-10 w-10 shrink-0 border-borde/70 bg-superficie/80 shadow-sm backdrop-blur-md" />
      </div>
    </header>
  );
}
