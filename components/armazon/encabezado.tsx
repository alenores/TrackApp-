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
      {/* Sombreado liviano para mayor realismo de la foto sin perder legibilidad */}
      <div className="absolute inset-0 bg-fondo/35 dark:bg-slate-950/40" />

      <div className="relative flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link
          href="/"
          aria-label="TrackApp inicio"
          className="flex items-center gap-2.5 min-w-0"
        >
          <img
            src="/logo-identidad.png"
            alt="TrackApp"
            className="h-8 w-8 rounded-lg object-contain shrink-0 shadow-sm"
          />
          <span className="truncate text-lg font-extrabold tracking-wide text-texto drop-shadow-md uppercase">
            TrackApp
          </span>
        </Link>

        <BotonDeModo className="h-9 w-9 shrink-0 border-borde/70 bg-superficie/85 shadow-sm" />
      </div>
    </header>
  );
}
