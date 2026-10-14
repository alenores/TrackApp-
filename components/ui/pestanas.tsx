"use client";

/**
 * **Pestañas de sección**: cambian lo que se ve abajo, no hacen nada. Por eso
 * no son botones: una fila de nombres, la elegida con la raya verde abajo y
 * las otras apagadas. Si no entran, la fila se desliza de costado.
 *
 * `chica` para pestañas adentro de otra sección, como las partes de un Camino.
 * Mockup aprobado por Ale el 2026-10-13.
 */
export function Pestanas<Valor extends string | number>({
  etiqueta,
  opciones,
  elegida,
  alElegir,
  chica = false,
}: {
  /** El nombre de la fila, para quien no ve. */
  etiqueta: string;
  opciones: { valor: Valor; texto: string }[];
  elegida: Valor;
  alElegir: (valor: Valor) => void;
  chica?: boolean;
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-borde-fuerte">
      {opciones.map((opcion) => {
        const esLaElegida = opcion.valor === elegida;
        return (
          <button
            key={opcion.valor}
            type="button"
            role="tab"
            aria-selected={esLaElegida}
            onClick={() => alElegir(opcion.valor)}
            className={[
              "shrink-0 whitespace-nowrap border-b-[3px] text-base",
              chica ? "px-3 py-2" : "px-4 py-2.5",
              esLaElegida
                ? "border-acento-borde font-semibold text-texto"
                : "border-transparent text-texto-suave hover:text-texto",
            ].join(" ")}
          >
            {opcion.texto}
          </button>
        );
      })}
    </div>
  );
}
