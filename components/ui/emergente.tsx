"use client";

import { createContext, useContext, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useYaEnElNavegador } from "@/hooks/use-del-navegador";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { useArrastreHaciaAbajo } from "@/hooks/use-arrastre-hacia-abajo";
import { Boton } from "@/components/ui/boton";
import { BotonCerrar } from "@/components/ui/boton-redondo";
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

/**
 * El lugar al costado del mapa, en la computadora, donde una ficha se abre sin
 * taparlo. Lo da `ListaYMapa` en Mapas; sin él (celular, navegación, mapa en
 * grande) la ficha va al medio, tapando todo.
 */
export const LugarAlCostado = createContext<HTMLElement | null>(null);

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
   *
   * **Solo para elegir qué se ve sobre un mapa mientras se lo mira.** Todo lo
   * demás —elegir una opción para hacer algo, confirmar, avisar— va en la
   * ventana al medio, sin `hoja`. Decisión de Ale del 2026-10-13: un panel que
   * sube para descargar o para agregar confunde.
   */
  hoja?: boolean;
  /**
   * `true` para las fichas de lo que se toca en un mapa: en la computadora,
   * dentro de Mapas, van al costado y no tapan el mapa. En el resto, al medio.
   */
  alCostado?: boolean;
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
  alCostado = false,
}: PropiedadesDeEmergente) {
  const lugarAlCostado = useContext(LugarAlCostado);
  const vaAlCostado = alCostado && lugarAlCostado !== null;
  const yaEstaVivo = useYaEnElNavegador();
  const { desplazamiento, arrastrando, manija, cuerpoRef } = useArrastreHaciaAbajo({ activo: abierto && hoja, alIrse: alCerrar });

  useCerrarConAtras(abierto, alCerrar);

  useEffect(() => {
    if (!abierto || vaAlCostado) return;

    // Con una emergente abierta, el fondo no se mueve.
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = desbordeAnterior;
    };
  }, [abierto, vaAlCostado]);

  if (!abierto || !yaEstaVivo) return null;

  if (vaAlCostado && lugarAlCostado) {
    return createPortal(
      <div role="dialog" aria-label={titulo} className="flex min-h-0 flex-1 flex-col">
        <CabezaDeEmergente
          titulo={titulo}
          descripcion={descripcion}
          alCerrar={alCerrar}
          className="cabeza-de-panel flex shrink-0 flex-col border-b border-borde px-4 py-2"
        />
        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        ) : null}
        {acciones ? <div className="flex shrink-0 gap-3 border-t border-borde px-4 py-4">{acciones}</div> : null}
      </div>,
      lugarAlCostado,
    );
  }

  return createPortal(
    <div
      // La ventana va al medio también en el celular; solo la hoja va abajo.
      className={`fixed inset-0 flex justify-center bg-velo ${hoja ? "items-end sm:items-center sm:p-4" : "items-center p-4"}`}
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
          // Toda emergente va en capas, igual que el panel que sube: la
          // cabecera en el gris más oscuro y el cuerpo en el color del panel,
          // así las opciones de adentro se despegan como tarjetas y con sol se
          // ve dónde empieza. Uniformidad total (Ale, 2026-10-13).
          "panel-que-sube flex max-h-[85dvh] w-full flex-col overflow-hidden border border-panel-borde bg-panel shadow-xl",
          hoja ? "rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:rounded-2xl sm:pb-0" : "rounded-2xl",
          ancho === "amplio" ? "max-w-2xl" : "max-w-md",
          hoja && !arrastrando ? "transition-transform duration-200 ease-out" : "",
        ].join(" ")}
      >
        {hoja ? (
          <div className="cabeza-de-panel flex touch-none justify-center pt-2.5 sm:hidden" aria-hidden {...manija}>
            <span className="h-1 w-9 rounded-full bg-borde-fuerte" />
          </div>
        ) : null}
        <CabezaDeEmergente
          titulo={titulo}
          descripcion={descripcion}
          alCerrar={alCerrar}
          className={`flex flex-col border-b border-borde px-4 cabeza-de-panel ${hoja ? "touch-none pb-4 pt-2 sm:touch-auto sm:pt-4" : "py-4"}`}
          {...(hoja ? manija : {})}
        />

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
 * El título y la cruz van en la misma fila, a la misma altura. El texto de
 * ayuda, si lo hay, queda debajo: si compartiera la fila, la cruz se centraría
 * contra el bloque entero y el título volvería a quedar más arriba.
 */
function CabezaDeEmergente({
  titulo,
  descripcion,
  alCerrar,
  className,
  ...resto
}: {
  titulo: string;
  descripcion?: string;
  alCerrar: () => void;
  className: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...resto}>
      <div className="flex items-center gap-3">
        <h2 className="flex min-h-10 min-w-0 flex-1 items-center text-base font-bold text-texto">{titulo}</h2>
        <BotonCerrar onClick={alCerrar} />
      </div>
      {descripcion ? <p className="mt-1 text-sm text-texto-suave">{descripcion}</p> : null}
    </div>
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
