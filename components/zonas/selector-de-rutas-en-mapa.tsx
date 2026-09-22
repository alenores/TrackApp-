"use client";

import { useState } from "react";
import { Emergente } from "@/components/ui/emergente";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { RutaResumen } from "@/types/database";
import { hexDeLaRuta } from "@/lib/rutas/colores";

type SelectorProps = {
  rutasCruzadas: RutaResumen[];
  idsEncendidos: number[];
  toggleRuta: (id: number) => void;
};

export function SelectorDeRutasEnMapa({ rutasCruzadas, idsEncendidos, toggleRuta }: SelectorProps) {
  const [abierto, setAbierto] = useState(false);

  if (rutasCruzadas.length === 0) return null;

  const cantidad = idsEncendidos.length;

  return (
    <>
      <button
        type="button"
        aria-label="Rutas en esta área"
        onPointerDown={() => vibrarAlTocar()}
        onClick={() => setAbierto(true)}
        className={[
          CLASE_DE_RESPUESTA_AL_TOQUE,
          "flex items-center justify-center rounded-full h-14 w-14 relative",
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
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
          <path d="M9 10a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
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
        titulo="Rutas en esta área"
        descripcion="Elegí cuáles querés ver dibujadas sobre el mapa para ubicarte."
      >
        <div className="space-y-1">
          {rutasCruzadas.map((ruta) => {
            const encendida = idsEncendidos.includes(ruta.id);
            const color = hexDeLaRuta(ruta.color);

            return (
              <label
                key={ruta.id}
                className="flex items-center justify-between gap-3 px-1 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full border-2"
                    style={{
                      backgroundColor: encendida ? color : "transparent",
                      borderColor: color,
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-base text-texto">{ruta.nombre}</span>
                    {ruta.largoKm && (
                      <span className="text-sm text-texto-suave">
                        {ruta.largoKm} km
                      </span>
                    )}
                  </div>
                </div>
                
                <input
                  type="checkbox"
                  className="h-6 w-6 rounded border-borde text-acento focus:ring-acento"
                  checked={encendida}
                  onChange={() => toggleRuta(ruta.id)}
                />
              </label>
            );
          })}
        </div>
      </Emergente>
    </>
  );
}
