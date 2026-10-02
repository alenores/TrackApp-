"use client";

import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  BotonDeOpcionesDeSalida,
  DatosDeSalida,
  PersonasDeSalida,
  PortadaDeSalida,
} from "@/components/salidas/partes-de-salida";
import type { Salida } from "@/types/database";

/**
 * Una salida en la lista: la portada con el título encima, quién fue, qué
 * hicieron y los números. **La descripción y las demás fotos están en la
 * ficha**, que se abre tocando la tarjeta.
 *
 * Solo dibuja. Si va el botón de tres puntitos lo decide la pantalla, que sabe
 * si hay señal y quién mira.
 */

type Props = {
  salida: Salida;
  /** Es de quien la mira y hay señal: van los tres puntitos. */
  puedeEditar: boolean;
};

export function TarjetaDeSalida({ salida, puedeEditar }: Props) {
  const conPortada = salida.fotos.length > 0;

  return (
    <div className="relative">
      <Enlace href={`/salidas/${salida.id}`} className="block rounded-2xl" aria-label={`Ver «${salida.titulo}»`}>
        <Tarjeta interactiva className="space-y-4 overflow-hidden">
          <PortadaDeSalida salida={salida} margenDeTarjeta conLugarParaBoton={puedeEditar} />
          <PersonasDeSalida salida={salida} />
          <DatosDeSalida salida={salida} />
        </Tarjeta>
      </Enlace>

      {puedeEditar ? (
        <div className="absolute right-2.5 top-2.5">
          <BotonDeOpcionesDeSalida salidaId={salida.id} sobreFoto={conPortada} />
        </div>
      ) : null}
    </div>
  );
}
