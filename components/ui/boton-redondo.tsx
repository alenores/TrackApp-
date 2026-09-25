"use client";

import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * **El botón redondo con un ícono**, el de los mapas del cerro: salir,
 * anotaciones, rutas y centrar en tu posición.
 *
 * Mide lo mismo que el alto de un botón normal. Prohibido agrandarlo
 * (decisión 024): los botones grandes tapan el mapa.
 *
 * Como no tiene texto, la `etiqueta` es obligatoria: es lo que dice el lector
 * de pantalla y lo que aparece al dejar el mouse encima.
 */

type Variante = "principal" | "secundario";

const CLASES_POR_VARIANTE: Record<Variante, string> = {
  principal: "border-acento-borde bg-acento text-acento-texto hover:bg-acento-hover",
  secundario: "border-borde-fuerte bg-superficie text-texto hover:bg-superficie-alta",
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  etiqueta: string;
  variante?: Variante;
  /** Los trazos del ícono, para dibujar dentro de un `<svg viewBox="0 0 24 24">`. */
  children: ReactNode;
};

export function BotonRedondo({
  etiqueta,
  variante = "secundario",
  className = "",
  type = "button",
  disabled,
  onPointerDown,
  children,
  ...props
}: Props) {
  const alTocar = (evento: PointerEvent<HTMLButtonElement>) => {
    if (!disabled) vibrarAlTocar();
    onPointerDown?.(evento);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      onPointerDown={alTocar}
      className={[
        CLASE_DE_RESPUESTA_AL_TOQUE,
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-[var(--sombra-alta)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        "disabled:cursor-not-allowed disabled:opacity-50",
        CLASES_POR_VARIANTE[variante],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
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
    </button>
  );
}

/** Los íconos de los mapas del cerro, en un solo lugar. */
export const ICONOS_DEL_CERRO = {
  salir: <path d="M6 6l12 12M18 6L6 18" />,
  anotaciones: (
    <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  ),
  rutas: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </>
  ),
  centrar: (
    <>
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
      <circle cx="12" cy="10" r="3" fill="currentColor" />
    </>
  ),
  mapa: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
};
