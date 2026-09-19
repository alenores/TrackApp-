"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarSector } from "@/app/actions/territorio";
import { Card } from "@/components/ui/card";
import { useDialogos } from "@/components/ui/dialogos";
import { Modal, BotonDeModal } from "@/components/ui/modal";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Sector } from "@/types/database";

/**
 * Un sector en la lista de una zona.
 *
 * El sector es la unidad que se descarga. El botón de bajar el mapa todavía no
 * está: los archivos de mapa no existen (ver la decisión 007). Cuando existan,
 * el botón entra acá.
 */

type SectorCardProps = {
  sector: Sector;
  soyAdministrador: boolean;
};

export function SectorCard({ sector, soyAdministrador }: SectorCardProps) {
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
        <Card tono="alta" className="space-y-2">
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
        </Card>

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

      <Modal
        abierto={opcionesAbiertas}
        alCerrar={() => setOpcionesAbiertas(false)}
        titulo={sector.nombre}
        acciones={
          <>
            <BotonDeModal
              variante="secundario"
              onClick={() => {
                setOpcionesAbiertas(false);
                router.push(
                  `/zonas/${sector.zonaId}/sectores/${sector.id}/editar`,
                );
              }}
            >
              Editar
            </BotonDeModal>
            <BotonDeModal
              variante="destructivo"
              disabled={borrando}
              onClick={() => void alBorrar()}
            >
              {borrando ? "Borrando…" : "Borrar"}
            </BotonDeModal>
          </>
        }
      />
    </>
  );
}
