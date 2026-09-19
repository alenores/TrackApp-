"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarSector } from "@/app/actions/territorio";
import { MapaDelSector } from "@/components/mapa/mapa-del-sector";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Sector } from "@/types/database";

/**
 * Un sector en la lista de una zona.
 *
 * **El sector es la unidad que se descarga**, así que su mapa se baja y se saca
 * desde acá mismo: es donde el usuario lo está mirando, y no hay que ir a
 * buscarlo a ninguna otra pantalla.
 */

type SectorCardProps = {
  sector: Sector;
  /** Todos los sectores: los vecinos comparten pedazos de mapa. */
  todosLosSectores: Sector[];
  soyAdministrador: boolean;
};

export function TarjetaDeSector({
  sector,
  todosLosSectores,
  soyAdministrador,
}: SectorCardProps) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar el sector «${sector.nombre}»?`,
      mensaje:
        "Se van también sus anotaciones. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });

    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarSector(sector.id);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }

    setOpcionesAbiertas(false);
    router.refresh();
  };

  return (
    <>
      <div className="relative">
        <Tarjeta tono="alta" className="space-y-2">
          <div className="pr-14">
            <h3 className="truncate text-base font-semibold text-texto">
              {sector.nombre}
            </h3>

            {sector.descripcion ? (
              <p className="mt-1 line-clamp-2 text-sm text-texto-suave">
                {sector.descripcion}
              </p>
            ) : null}
          </div>

          <p className="text-xs text-texto-suave">{mostrarTamano(sector.rectangulo)}</p>

          <MapaDelSector sector={sector} todosLosSectores={todosLosSectores} />
        </Tarjeta>

        {soyAdministrador ? (
          <button
            type="button"
            aria-label={`Opciones de ${sector.nombre}`}
            onClick={() => setOpcionesAbiertas(true)}
            className="absolute right-2 top-2 flex h-14 w-14 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-alta hover:text-texto"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <circle cx="12" cy="5" r="1.75" fill="currentColor" />
              <circle cx="12" cy="12" r="1.75" fill="currentColor" />
              <circle cx="12" cy="19" r="1.75" fill="currentColor" />
            </svg>
          </button>
        ) : null}
      </div>

      <Emergente
        abierto={opcionesAbiertas}
        alCerrar={() => setOpcionesAbiertas(false)}
        titulo={sector.nombre}
        acciones={
          <>
            <BotonDeEmergente
              variante="secundario"
              onClick={() => {
                setOpcionesAbiertas(false);
                router.push(
                  `/zonas/${sector.zonaId}/sectores/${sector.id}/editar`,
                );
              }}
            >
              Editar
            </BotonDeEmergente>
            <BotonDeEmergente
              variante="destructivo"
              disabled={borrando}
              onClick={() => void alBorrar()}
            >
              {borrando ? "Borrando…" : "Borrar"}
            </BotonDeEmergente>
          </>
        }
      />
    </>
  );
}
