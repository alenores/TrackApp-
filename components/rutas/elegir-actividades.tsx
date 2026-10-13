"use client";

import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import type { ActividadRuta } from "@/types/database";

/**
 * Elegir actividades con las mismas insignias que se ven en toda la app (el
 * perfil, Consultas, Marcas, las tarjetas): la elegida prendida, las otras en
 * gris. `una` cuando se elige una sola; `varias` cuando se prenden y apagan.
 */
export function ElegirActividades({ etiqueta, elegidas, alTocar, modo = "una" }: {
  etiqueta: string;
  elegidas: ActividadRuta[];
  alTocar: (actividad: ActividadRuta) => void;
  modo?: "una" | "varias";
}) {
  return (
    <div role={modo === "una" ? "radiogroup" : "group"} aria-label={etiqueta} className="space-y-1.5">
      <p className="text-base font-semibold text-texto">{etiqueta}</p>
      <div className="flex flex-wrap gap-1.5">
        {ACTIVIDADES.map((actividad) => {
          const prendida = elegidas.includes(actividad.tipo);
          return (
            <button key={actividad.tipo} type="button" role={modo === "una" ? "radio" : "checkbox"} aria-checked={prendida}
              onClick={() => alTocar(actividad.tipo)}
              className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
              <InsigniaDeActividad tipo={actividad.tipo} tamano="mediano" apagada={!prendida} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
