"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarZona } from "@/app/actions/territorio";
import { Card } from "@/components/ui/card";
import { ChevronCircle } from "@/components/ui/chevron-circle";
import { useDialogos } from "@/components/ui/dialogos";
import { Modal, BotonDeModal } from "@/components/ui/modal";
import { TapLink } from "@/components/ui/tap-link";
import type { Zona } from "@/types/database";

/**
 * Una zona en la lista.
 *
 * Crear, editar y borrar zonas es tarea exclusiva del administrador, así que el
 * botón de opciones solo aparece para él. La base lo verifica igual por su
 * cuenta: esconder el botón es para no ofrecer algo que después va a fallar.
 */

type ZonaCardProps = {
  zona: Zona;
  soyAdministrador: boolean;
  cantidadDeSectores?: number;
};

export function ZonaCard({
  zona,
  soyAdministrador,
  cantidadDeSectores,
}: ZonaCardProps) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar la zona «${zona.nombre}»?`,
      mensaje:
        "Se van también sus sectores y las anotaciones de cada uno. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });

    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarZona(zona.id);
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
        <TapLink href={`/zonas/${zona.id}`} className="block">
          <Card interactiva className="space-y-2">
            <div className="flex items-start justify-between gap-3 pr-14">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-texto">
                  {zona.nombre}
                </h2>

                {zona.descripcion ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-texto-suave">
                    {zona.descripcion}
                  </p>
                ) : null}
              </div>

              <ChevronCircle direction="right" className="-mt-0.5 shrink-0" />
            </div>

            {cantidadDeSectores !== undefined ? (
              <p className="text-xs text-texto-suave">
                {cantidadDeSectores === 0
                  ? "Todavía no tiene sectores"
                  : cantidadDeSectores === 1
                    ? "1 sector"
                    : `${cantidadDeSectores} sectores`}
              </p>
            ) : null}
          </Card>
        </TapLink>

        {soyAdministrador ? (
          <button
            type="button"
            aria-label={`Opciones de ${zona.nombre}`}
            onClick={() => setOpcionesAbiertas(true)}
            className="absolute right-3 top-3 flex h-14 w-14 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-alta hover:text-texto"
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
        titulo={zona.nombre}
        acciones={
          <>
            <BotonDeModal
              variante="secundario"
              onClick={() => {
                setOpcionesAbiertas(false);
                router.push(`/zonas/${zona.id}/editar`);
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
