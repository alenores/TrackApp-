"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { Button } from "@/components/ui/button";

/**
 * **La única pieza que dibuja pantallas emergentes en toda la app.**
 *
 * Antes cada pantalla se hacía la suya a mano, con su propio velo y su propio
 * nivel de apilado. En Vías de Escalada eso terminó en 75 archivos con capas
 * escritas a mano, niveles del 1 al 10.000, y dos rojos distintos para el mismo
 * botón de borrar. Cambiar una regla de diseño obligaba a tocar dieciséis
 * archivos.
 *
 * Esta pieza ya resuelve, por su cuenta y para todas:
 * - el velo y el apilado, por orden de apertura;
 * - el cierre con el botón físico de atrás;
 * - que el atrás cierre la emergente y no la app.
 *
 * **No escribir capas ni niveles de apilado a mano en ninguna pantalla.**
 */

let emergentesAbiertas = 0;

type ModalProps = {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  /** Los botones del pie. Van con `BotonDeModal`. */
  acciones?: ReactNode;
  /** `true` cuando el contenido necesita más ancho, como una ficha con foto. */
  ancho?: "normal" | "amplio";
};

export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  acciones,
  ancho = "normal",
}: ModalProps) {
  const nivelRef = useRef(0);

  useCerrarConAtras(abierto, alCerrar);

  useEffect(() => {
    if (!abierto) return;

    emergentesAbiertas += 1;
    nivelRef.current = emergentesAbiertas;

    // Con una emergente abierta, el fondo no se mueve.
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      emergentesAbiertas = Math.max(0, emergentesAbiertas - 1);
      document.body.style.overflow = desbordeAnterior;
    };
  }, [abierto]);

  if (!abierto) return null;

  // Arranca bien arriba de cualquier número escrito a mano: una emergente
  // tapada es un aviso que nadie ve.
  const nivel = 10_000 + nivelRef.current;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-velo p-4 sm:items-center"
      style={{ zIndex: nivel }}
      onClick={alCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        className={[
          "flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-2xl border border-borde bg-superficie shadow-xl",
          ancho === "amplio" ? "max-w-2xl" : "max-w-md",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 border-b border-borde px-4 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-texto">{titulo}</h2>
            {descripcion ? (
              <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-texto-suave hover:bg-superficie-alta hover:text-texto"
          >
            ×
          </button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
        ) : null}

        {acciones ? (
          <div className="flex gap-3 border-t border-borde px-4 py-4">
            {acciones}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Los botones del pie de una emergente.
 *
 * Usa las mismas variantes que el resto de la app, así que **hay un solo rojo
 * de borrar** en todos lados.
 */
export function BotonDeModal({
  variante = "secundario",
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variante={variante} anchoCompleto {...props}>
      {children}
    </Button>
  );
}
