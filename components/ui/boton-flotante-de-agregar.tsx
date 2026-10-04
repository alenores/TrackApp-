"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Enlace } from "@/components/ui/enlace";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { vibrarAlTocar } from "@/lib/vibracion";
import { NIVEL_DE_LOS_BOTONES_FLOTANTES } from "@/lib/capas";

/**
 * **Los botones flotantes de la app**, abajo a la derecha, al alcance del
 * pulgar: el «+» de cargar algo nuevo y el de navegar una ruta.
 *
 * Miden lo mismo que el alto de un botón normal (decisión 024).
 */

const CLASE_FLOTANTE =
  "fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 flex h-10 w-10 items-center justify-center rounded-full border border-acento-borde bg-acento text-acento-texto shadow-[var(--sombra-alta)]";

/**
 * El «+» que lleva a cargar algo nuevo. Cargar escribe en la base: sin señal
 * el botón no sirve para nada, así que no está.
 */
export function BotonFlotanteDeAgregar({ href, etiqueta }: { href: string; etiqueta: string }) {
  // El portal necesita el `document`, que recién existe en el navegador.
  const yaEstaVivo = useYaEnElNavegador();
  const haySenal = useHaySenal();

  if (!yaEstaVivo || !haySenal) return null;

  return createPortal(
    <Enlace
      href={href}
      aria-label={etiqueta}
      title={etiqueta}
      className={`${CLASE_FLOTANTE} text-2xl font-light leading-none`}
      style={{ zIndex: NIVEL_DE_LOS_BOTONES_FLOTANTES }}
    >
      +
    </Enlace>,
    document.body,
  );
}

/**
 * Un botón flotante con ícono que hace algo en la misma pantalla. Este no se
 * esconde sin señal: quien lo usa decide si necesita internet.
 *
 * `soloCelular` lo deja solo en pantallas chicas; en la computadora la acción
 * va en su botón de siempre.
 */
export function BotonFlotante({
  etiqueta,
  alTocar,
  soloCelular = false,
  children,
}: {
  etiqueta: string;
  alTocar: () => void;
  soloCelular?: boolean;
  /** Los trazos del ícono, para un `<svg viewBox="0 0 24 24">`. */
  children: ReactNode;
}) {
  const yaEstaVivo = useYaEnElNavegador();
  if (!yaEstaVivo) return null;

  return createPortal(
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      onPointerDown={() => vibrarAlTocar()}
      onClick={alTocar}
      className={`${CLASE_FLOTANTE} ${soloCelular ? "lg:hidden" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde`}
      style={{ zIndex: NIVEL_DE_LOS_BOTONES_FLOTANTES }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>,
    document.body,
  );
}
