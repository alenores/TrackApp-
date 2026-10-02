"use client";

import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import {
  BotonDeOpcionesDeSalida,
  ParticipantesDeSalida,
  PortadaDeSalida,
} from "@/components/salidas/partes-de-salida";
import type { Salida } from "@/types/database";

/**
 * Una salida en la lista: la portada con todo encima (título, día, números y
 * la línea) y, abajo, quiénes fueron y qué hicieron. **La descripción y las
 * demás fotos están en la ficha**, que se abre tocando la tarjeta.
 *
 * Solo dibuja. Si van los tres puntitos lo decide la pantalla, que sabe si hay
 * señal y quién mira.
 */

type Props = {
  salida: Salida;
  /** Es de quien la mira y hay señal: van los tres puntitos. */
  puedeEditar: boolean;
};

export function TarjetaDeSalida({ salida, puedeEditar }: Props) {
  return (
    <div className="relative">
      <Enlace href={`/salidas/${salida.id}`} className="block rounded-2xl" aria-label={`Ver «${salida.titulo}»`}>
        <Tarjeta interactiva className="space-y-3 overflow-hidden">
          <PortadaDeSalida salida={salida} margenDeTarjeta />
          <div className="flex items-center justify-between gap-3">
            <ParticipantesDeSalida salida={salida} />
            <div className="shrink-0">
              <InsigniasDeActividad actividades={salida.actividades} />
            </div>
          </div>
        </Tarjeta>
      </Enlace>

      {puedeEditar ? (
        <div className="absolute right-2.5 top-2.5">
          <BotonDeOpcionesDeSalida salidaId={salida.id} sobreFoto />
        </div>
      ) : null}
    </div>
  );
}
