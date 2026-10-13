"use client";

import { Boton } from "@/components/ui/boton";
import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import type { ActividadRuta } from "@/types/database";

type Propiedades = {
  actividad: ActividadRuta;
  alCambiar: (actividad: ActividadRuta) => void;
  /**
   * `insignias`: chicas, como en el perfil; la elegida va prendida y las otras
   * en gris. Es para Consultas, donde va adentro del renglón de Caminos.
   * Sin esto, botones de tamaño normal, como en la navegación libre.
   */
  forma?: "botones" | "insignias";
};

export function SelectorDeActividadPrincipal({ actividad, alCambiar, forma = "botones" }: Propiedades) {
  if (forma === "insignias") {
    return (
      <div role="radiogroup" aria-label="Actividad principal del mapa" className="space-y-1.5">
        <p className="text-sm font-medium text-texto-suave">Actividad principal</p>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVIDADES.map((opcion) => {
            const elegida = actividad === opcion.tipo;
            return (
              <button key={opcion.tipo} type="button" role="radio" aria-checked={elegida}
                onClick={() => alCambiar(opcion.tipo)}
                className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
                <InsigniaDeActividad tipo={opcion.tipo} tamano="mediano" apagada={!elegida} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Actividad principal del mapa">
      <span className="text-base font-medium text-texto">Actividad principal:</span>
      {ACTIVIDADES.map((opcion) => (
        <Boton key={opcion.tipo} variante={actividad === opcion.tipo ? "principal" : "secundario"}
          aria-pressed={actividad === opcion.tipo} onClick={() => alCambiar(opcion.tipo)}>
          {opcion.etiqueta}
        </Boton>
      ))}
    </div>
  );
}
