"use client";

import { Boton } from "@/components/ui/boton";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import type { ActividadRuta } from "@/types/database";

type Propiedades = { actividad: ActividadRuta; alCambiar: (actividad: ActividadRuta) => void };

export function SelectorDeActividadPrincipal({ actividad, alCambiar }: Propiedades) {
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
