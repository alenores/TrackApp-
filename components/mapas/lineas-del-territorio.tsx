"use client";

import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { OPCIONES_DE_LINEAS, type VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { vibrarAlTocar } from "@/lib/vibracion";

/**
 * Círculos para las líneas del territorio. Los sectores no se eligen solos.
 *
 * `suelto` son las tres: nada, zonas, o zonas y sectores. Así va al marcar
 * un punto, un Camino o un trazo.
 * `en-zonas` va adentro del casillero de Zonas en Consultas: no hay «Nada»,
 * porque destildar Zonas ya apaga las líneas.
 */
export function LineasDelTerritorio({
  valor,
  alElegir,
  lugar = "suelto",
}: {
  valor: VistaDeLineas;
  alElegir: (valor: VistaDeLineas) => void;
  lugar?: "suelto" | "en-zonas";
}) {
  const opciones = lugar === "en-zonas"
    ? [
        { valor: "zonas" as const, etiqueta: "Solo las zonas" },
        { valor: "zonas_y_sectores" as const, etiqueta: "Zonas y sectores" },
      ]
    : OPCIONES_DE_LINEAS;
  const titulo = lugar === "en-zonas" ? "Qué líneas" : "Líneas";

  return (
    <fieldset className="border-0 p-0">
      <legend className={lugar === "en-zonas"
        ? "mb-1.5 p-0 text-sm font-medium text-texto-suave"
        : `mb-2 p-0 ${CLASE_DE_TITULO_DE_SECCION}`}>
        {titulo}
      </legend>
      <div role="radiogroup" aria-label={titulo} className="flex flex-wrap gap-x-4 gap-y-1">
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor;
          return (
            <button
              key={opcion.valor}
              type="button"
              role="radio"
              aria-checked={elegida}
              onPointerDown={() => vibrarAlTocar()}
              onClick={() => alElegir(opcion.valor)}
              className={[
                CLASE_DE_RESPUESTA_AL_TOQUE,
                "inline-flex min-h-10 items-center gap-2 text-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
                elegida ? "font-semibold text-texto" : "text-texto-suave",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  elegida ? "border-acento-borde" : "border-borde-fuerte",
                ].join(" ")}
              >
                {elegida ? <span className="h-2 w-2 rounded-full bg-acento" /> : null}
              </span>
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
