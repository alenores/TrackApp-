"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

import { clasesDeBoton, type VarianteDeBoton } from "@/components/ui/boton";

type TapLinkProps = ComponentProps<typeof Link> & { variante?: VarianteDeBoton };

/**
 * **Sin precarga automática.** Si no, cada link a la vista le pediría su
 * pantalla al servidor aunque el usuario nunca lo toque. Las de todos los días
 * ya quedan listas al abrir (`usePantallasListasAlAbrir`); el resto se pide la
 * primera vez que se entra, y después se reusa mientras la app está abierta.
 */
export function Enlace({ className = "", variante, onPointerDown, prefetch = false, ...props }: TapLinkProps) {
  return (
    <Link
      {...props}
      prefetch={prefetch}
      className={[variante ? clasesDeBoton(variante) : CLASE_DE_RESPUESTA_AL_TOQUE, className].filter(Boolean).join(" ")}
      onPointerDown={(event) => {
        vibrarAlTocar();
        onPointerDown?.(event);
      }}
    />
  );
}
