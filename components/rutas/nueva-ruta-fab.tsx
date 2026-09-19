"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";

export function NuevaRutaFab() {
  // El portal necesita el `document`, que recién existe en el navegador.
  const yaEstaVivo = useYaEnElNavegador();

  if (!yaEstaVivo) {
    return null;
  }

  return createPortal(
    <Link
      href="/rutas/nueva"
      aria-label="Nueva ruta"
      className="fixed z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-acento-borde bg-acento text-2xl font-light leading-none text-acento-texto shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95 bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4"
    >
      +
    </Link>,
    document.body,
  );
}
