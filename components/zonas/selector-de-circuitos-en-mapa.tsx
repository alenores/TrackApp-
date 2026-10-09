"use client";

import { useState } from "react";
import { Emergente } from "@/components/ui/emergente";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { CircuitoSinDibujo } from "@/lib/offline/circuitos";
import { textoDeDistancia } from "@/lib/alturas/grafico";

/**
 * Prender Circuitos sobre el mapa de una zona, para ver por dónde pasan
 * (decisión 049: antes eran las rutas).
 */

type SelectorProps = {
  circuitos: CircuitoSinDibujo[];
  idsEncendidos: number[];
  alternar: (id: number) => void;
};

export function SelectorDeCircuitosEnMapa({ circuitos, idsEncendidos, alternar }: SelectorProps) {
  const [abierto, setAbierto] = useState(false);
  const cantidad = idsEncendidos.length;

  return (
    <>
      <button
        type="button"
        aria-label="Circuitos en esta zona"
        onPointerDown={() => vibrarAlTocar()}
        onClick={() => setAbierto(true)}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex items-center justify-center rounded-full h-10 w-10 relative",
          "border border-borde-fuerte bg-superficie text-texto shadow-[var(--sombra-alta)]",
          "hover:bg-superficie-alta",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>

        {cantidad > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-acento text-[10px] font-bold text-acento-texto shadow">
            {cantidad}
          </span>
        )}
      </button>

      <Emergente
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Circuitos en el mapa"
        descripcion="Elegí cuáles querés ver dibujados sobre el mapa para ubicarte."
      >
        <div className="space-y-1">
          {circuitos.length === 0 ? (
            <p className="px-1 py-3 text-base text-texto-suave">
              Ningún Circuito guardado en el celular pasa por esta zona.
            </p>
          ) : (
            circuitos.map((circuito) => {
              const encendida = idsEncendidos.includes(circuito.id);

            return (
              <label
                key={circuito.id}
                className="flex items-center justify-between gap-3 px-1 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-base text-texto">{circuito.nombre}</span>
                    {circuito.totales ? (
                      <span className="text-base text-texto-suave">
                        {textoDeDistancia(circuito.totales.largoM)}
                      </span>
                    ) : null}
                  </div>
                </div>
                
                <input
                  type="checkbox"
                  className="h-6 w-6 rounded border-borde text-acento focus:ring-acento"
                  checked={encendida}
                  onChange={() => alternar(circuito.id)}
                />
              </label>
            );
          }))}
        </div>
      </Emergente>
    </>
  );
}
