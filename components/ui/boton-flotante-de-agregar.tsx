"use client";

import { createPortal } from "react-dom";
import { Enlace } from "@/components/ui/enlace";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { NIVEL_DE_LOS_BOTONES_FLOTANTES } from "@/lib/capas";

/**
 * **El único botón «+» flotante de la app**, abajo a la derecha, al alcance
 * del pulgar. Lleva a la pantalla de cargar algo nuevo.
 *
 * Cargar escribe en la base: sin señal el botón no sirve para nada, así que
 * no está. Mide lo mismo que el alto de un botón normal (decisión 024).
 */

type Props = {
  href: string;
  /** Qué hace, para quien no ve el «+». */
  etiqueta: string;
};

export function BotonFlotanteDeAgregar({ href, etiqueta }: Props) {
  // El portal necesita el `document`, que recién existe en el navegador.
  const yaEstaVivo = useYaEnElNavegador();
  const haySenal = useHaySenal();

  if (!yaEstaVivo || !haySenal) return null;

  return createPortal(
    <Enlace
      href={href}
      aria-label={etiqueta}
      title={etiqueta}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 flex h-10 w-10 items-center justify-center rounded-full border border-acento-borde bg-acento text-2xl font-light leading-none text-acento-texto shadow-[var(--sombra-alta)]"
      style={{ zIndex: NIVEL_DE_LOS_BOTONES_FLOTANTES }}
    >
      +
    </Enlace>,
    document.body,
  );
}
