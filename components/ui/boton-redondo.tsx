"use client";

import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { trazosDeClase } from "@/components/marcas/icono-de-clase";
import { ICONO_DE_CIRCUITOS, ICONO_DE_MARCAS, iconoDeUbicarme } from "@/components/ui/iconos";

/**
 * **El botón redondo con un ícono**, el de los mapas del cerro: salir,
 * Marcas, Circuitos y centrar en tu posición.
 *
 * Mide lo mismo que el alto de un botón normal. Prohibido agrandarlo
 * (decisión 024): los botones grandes tapan el mapa.
 *
 * Como no tiene texto, la `etiqueta` es obligatoria: es lo que dice el lector
 * de pantalla y lo que aparece al dejar el mouse encima.
 */

type Variante = "principal" | "secundario" | "soloPuntos";

const CLASES_POR_VARIANTE: Record<Exclude<Variante, "soloPuntos">, string> = {
  principal: "border-acento-borde bg-acento text-acento-texto hover:bg-acento-hover",
  secundario: "border-borde-fuerte bg-superficie text-texto hover:bg-superficie-alta",
};

export function clasesDeBotonRedondo(variante: Variante = "secundario", className = ""): string {
  const soloPuntos = variante === "soloPuntos";
  return [
    CLASE_DE_RESPUESTA_AL_TOQUE,
    "flex h-10 w-10 shrink-0 items-center justify-center",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
    "disabled:cursor-not-allowed disabled:opacity-50",
    soloPuntos ? "bg-transparent" : "rounded-full border shadow-[var(--sombra-alta)]",
    soloPuntos ? "" : CLASES_POR_VARIANTE[variante],
    className,
  ].filter(Boolean).join(" ");
}

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
      className={clasesDeBotonRedondo(variante, className)}
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
  marcas: ICONO_DE_MARCAS,
  /** Otros Circuitos en el mapa. */
  circuitos: ICONO_DE_CIRCUITOS,
  /** El mismo dibujo de Camino que en Marcas. En la navegación libre abre la actividad. */
  caminos: trazosDeClase("camino"),
  centrar: iconoDeUbicarme(true),
  mapa: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  /** El gráfico de alturas: una línea que sube y baja sobre su base. */
  alturas: <path d="M3 20h18M3 16l5-7 4 4 3-5 6 8" />,
};

/**
 * La cruz para cerrar. Siempre el mismo círculo, del alto de un botón normal:
 * emergentes, hojas, fichas, paneles y el mapa en grande.
 */
export function BotonCerrar({
  etiqueta = "Cerrar",
  ...props
}: Omit<Props, "children" | "etiqueta"> & { etiqueta?: string }) {
  return (
    <BotonRedondo etiqueta={etiqueta} {...props}>
      {ICONOS_DEL_CERRO.salir}
    </BotonRedondo>
  );
}
