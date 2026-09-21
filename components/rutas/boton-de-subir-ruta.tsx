"use client";

import Link from "next/link";
import { NIVEL_DE_LOS_BOTONES_FLOTANTES } from "@/lib/capas";
import { createPortal } from "react-dom";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { useHaySenal } from "@/hooks/use-hay-senal";

export function BotonDeSubirRuta() {
  // El portal necesita el `document`, que recién existe en el navegador.
  const yaEstaVivo = useYaEnElNavegador();
  // Subir una ruta escribe en la base: sin señal el botón no sirve para nada,
  // así que no está.
  const haySenal = useHaySenal();

  if (!yaEstaVivo || !haySenal) {
    return null;
  }

  return createPortal(
    <Link
      href="/rutas/nueva"
      aria-label="Nueva ruta"
      className="fixed flex h-14 w-14 items-center justify-center rounded-full border border-acento-borde bg-acento text-2xl font-light leading-none text-acento-texto shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95 bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4"
      style={{ zIndex: NIVEL_DE_LOS_BOTONES_FLOTANTES }}
    >
      +
    </Link>,
    document.body,
  );
}
