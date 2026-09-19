"use client";

import type { ButtonHTMLAttributes, PointerEvent } from "react";
import { triggerTapHaptic } from "@/lib/haptics";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

/**
 * **El único botón de la app.**
 *
 * No se arma un botón nuevo escribiendo clases a mano: si hace falta una
 * variante que no está, se agrega acá. Así una regla de diseño se cambia en un
 * solo lugar y no en dieciséis.
 *
 * La zona tocable nunca baja de 56 píxeles, y de 64 en la pantalla de
 * navegación: se toca caminando, con guantes, y el dedo no apunta fino.
 */

export type VarianteDeBoton =
  | "principal"
  | "secundario"
  | "destructivo"
  | "fantasma";

const CLASES_POR_VARIANTE: Record<VarianteDeBoton, string> = {
  principal:
    "bg-acento text-acento-texto hover:bg-acento-hover border border-acento-borde",
  secundario:
    "bg-superficie-alta text-texto hover:bg-superficie border border-borde-fuerte",
  // Un solo rojo de borrar en toda la app. No escribir otro a mano.
  destructivo:
    "bg-rojo-fondo text-rojo-texto hover:bg-rojo-fondo-fuerte border border-rojo-borde",
  fantasma:
    "bg-transparent text-texto-suave hover:bg-superficie-alta hover:text-texto",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteDeBoton;
  anchoCompleto?: boolean;
  /** `true` en la pantalla de navegación, donde la zona tocable sube a 64. */
  paraNavegacion?: boolean;
};

export function Button({
  variante = "principal",
  anchoCompleto = false,
  paraNavegacion = false,
  className = "",
  type = "button",
  disabled,
  children,
  onPointerDown,
  ...props
}: ButtonProps) {
  const alTocar = (evento: PointerEvent<HTMLButtonElement>) => {
    if (!disabled) triggerTapHaptic();
    onPointerDown?.(evento);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onPointerDown={alTocar}
      className={[
        TAP_FEEDBACK_CLASS,
        "inline-flex items-center justify-center rounded-xl px-5 font-semibold transition-colors",
        paraNavegacion ? "min-h-16 py-4 text-lg" : "min-h-14 py-3 text-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        "disabled:cursor-not-allowed disabled:opacity-50",
        anchoCompleto ? "w-full" : "",
        CLASES_POR_VARIANTE[variante],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
