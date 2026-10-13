"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { useArrastreHaciaAbajo } from "@/hooks/use-arrastre-hacia-abajo";
import { Boton } from "@/components/ui/boton";
import { NIVEL_DE_LAS_EMERGENTES } from "@/lib/capas";

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
 *
 * El apilado no lleva números. Todas las emergentes se cuelgan al final del
 * documento y se dibujan en el orden en que se abrieron, así la última siempre
 * queda arriba. Un número escrito a mano es justo lo que termina tapando un
 * aviso que nadie ve.
 */

type PropiedadesDeEmergente = {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  /** Los botones del pie. Van con `BotonDeEmergente`. */
  acciones?: ReactNode;
  /** `true` cuando el contenido necesita más ancho, como una ficha con foto. */
  ancho?: "normal" | "amplio";
  /**
   * `true` para la hoja que sube desde abajo en el celular: lleva manija y se
   * baja con el dedo, con los mismos gestos que Vías de Escalada. También
   * cierra con la cruz, tocando afuera y con el botón físico de atrás.
   */
  hoja?: boolean;
};

export function Emergente({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  acciones,
  ancho = "normal",
  hoja = false,
}: PropiedadesDeEmergente) {
  const yaEstaVivo = useYaEnElNavegador();
  const { desplazamiento, arrastrando, manija, cuerpoRef } = useArrastreHaciaAbajo({ activo: abierto && hoja, alIrse: alCerrar });

  useCerrarConAtras(abierto, alCerrar);

  useEffect(() => {
    if (!abierto) return;

    // Con una emergente abierta, el fondo no se mueve.
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = desbordeAnterior;
    };
  }, [abierto]);

  if (!abierto || !yaEstaVivo) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-end justify-center bg-velo sm:items-center ${hoja ? "sm:p-4" : "p-4"}`}
      style={{ zIndex: NIVEL_DE_LAS_EMERGENTES }}
      onClick={alCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        style={hoja && desplazamiento > 0 ? { transform: `translateY(${desplazamiento}px)` } : undefined}
        className={[
          // La hoja va en capas: la cabecera en superficie y el cuerpo en el
          // color del panel, así las opciones de adentro se despegan como
          // tarjetas y con sol se ve dónde empieza el panel.
          `flex max-h-[85dvh] w-full flex-col overflow-hidden border shadow-xl ${hoja ? "panel-que-sube border-panel-borde bg-panel" : "border-borde bg-superficie"}`,
          hoja ? "rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:rounded-2xl sm:pb-0" : "rounded-2xl",
          ancho === "amplio" ? "max-w-2xl" : "max-w-md",
          hoja && !arrastrando ? "transition-transform duration-200 ease-out" : "",
        ].join(" ")}
      >
        {hoja ? (
          <div className="flex touch-none justify-center bg-superficie pt-2.5 sm:hidden" aria-hidden {...manija}>
            <span className="h-1 w-9 rounded-full bg-borde-fuerte" />
          </div>
        ) : null}
        <div className={`flex items-start gap-3 border-b border-borde px-4 ${hoja ? "touch-none bg-superficie pb-4 pt-2 sm:touch-auto sm:pt-4" : "py-4"}`}
          {...(hoja ? manija : {})}>
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-texto-suave hover:bg-superficie-alta hover:text-texto"
          >
            ×
          </button>
        </div>

        {children ? (
          <div ref={hoja ? cuerpoRef : undefined} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {children}
          </div>
        ) : null}

        {acciones ? (
          <div className="flex gap-3 border-t border-borde px-4 py-4">
            {acciones}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Los botones del pie de una emergente.
 *
 * Usa las mismas variantes que el resto de la app, así que **hay un solo rojo
 * de borrar** en todos lados.
 */
export function BotonDeEmergente({
  variante = "secundario",
  children,
  ...props
}: React.ComponentProps<typeof Boton>) {
  return (
    <Boton variante={variante} anchoCompleto {...props}>
      {children}
    </Boton>
  );
}
