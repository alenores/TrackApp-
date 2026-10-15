"use client";

import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { OPCIONES_DE_LINEAS, type VistaDeLineas } from "@/lib/mapas/lineas-del-territorio";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { vibrarAlTocar } from "@/lib/vibracion";

/**
 * Tres círculos para las líneas del territorio: nada, zonas, o zonas y
 * sectores. Los sectores no se eligen solos.
 */
export function LineasDelTerritorio({
  valor,
  alElegir,
}: {
  valor: VistaDeLineas;
  alElegir: (valor: VistaDeLineas) => void;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className={`mb-2 p-0 ${CLASE_DE_TITULO_DE_SECCION}`}>Líneas</legend>
      <div role="radiogroup" aria-label="Líneas" className="flex flex-wrap gap-x-4 gap-y-1">
        {OPCIONES_DE_LINEAS.map((opcion) => {
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
