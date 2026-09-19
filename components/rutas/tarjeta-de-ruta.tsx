"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarRuta } from "@/app/actions/rutas";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { AvatarDeQuienSubio } from "@/components/rutas/avatar-de-quien-subio";
import { Tarjeta } from "@/components/ui/tarjeta";
import { FlechaRedonda } from "@/components/ui/flecha-redonda";
import { useDialogos } from "@/components/ui/dialogos";
import { Enlace } from "@/components/ui/enlace";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import {
  RUTA_DATA_CELL_CLASS,
  RUTA_DATA_GRID_CLASS,
  RUTA_DATA_LABEL_CLASS,
  RUTA_DATA_VALUE_CLASS,
  RUTA_DISTANCE_VALUE_CLASS,
} from "@/lib/rutas/estilos-de-celda";
import { mostrarLargo } from "@/lib/rutas/actividades";
import type { RutaResumen } from "@/types/database";

/**
 * Una ruta en la lista.
 *
 * La versión anterior abría editar y borrar solo manteniendo el dedo apretado.
 * Con guantes eso no se puede: **ningún gesto fino puede ser la única forma de
 * hacer algo**, así que ahora hay un botón visible.
 */

type RutaCardProps = {
  ruta: RutaResumen;
  autor: string;
  avatarDelAutor?: string | null;
  soyElAutor: boolean;
};

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function TarjetaDeRuta({
  ruta,
  autor,
  avatarDelAutor,
  soyElAutor,
}: RutaCardProps) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const [accionesAbiertas, setAccionesAbiertas] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar «${ruta.nombre}»?`,
      mensaje:
        "La ruta deja de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });

    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarRuta(ruta.id);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }

    setAccionesAbiertas(false);
    router.refresh();
  };

  return (
    <>
      <div className="relative">
        <Enlace href={`/rutas/${ruta.id}`} className="block">
          <Tarjeta interactiva className="space-y-3">
            <div className="space-y-1 pr-14">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 text-lg font-semibold text-texto">
                  {ruta.nombre}
                </h2>
                <FlechaRedonda direction="right" className="-mt-0.5 shrink-0" />
              </div>

              {ruta.descripcion ? (
                <p className="line-clamp-2 break-words whitespace-pre-wrap text-sm leading-6 text-texto-suave">
                  {ruta.descripcion}
                </p>
              ) : null}

              <InsigniasDeActividad actividades={ruta.actividades} />
            </div>

            <dl className={RUTA_DATA_GRID_CLASS}>
              <div className={RUTA_DATA_CELL_CLASS}>
                <dt className={RUTA_DATA_LABEL_CLASS}>Largo</dt>
                <dd className={RUTA_DISTANCE_VALUE_CLASS}>
                  {mostrarLargo(ruta.largoKm)}
                </dd>
              </div>

              <div className={RUTA_DATA_CELL_CLASS}>
                <dt className={RUTA_DATA_LABEL_CLASS}>Subida por</dt>
                <dd className={RUTA_DATA_VALUE_CLASS}>{autor}</dd>
                <AvatarDeQuienSubio
                  avatarUrl={avatarDelAutor}
                  uploaderLabel={autor}
                  size="sm"
                />
              </div>

              <div className={RUTA_DATA_CELL_CLASS}>
                <dt className={RUTA_DATA_LABEL_CLASS}>Fecha</dt>
                <dd className={RUTA_DATA_VALUE_CLASS}>
                  {fechaCorta(ruta.creadoEn)}
                </dd>
              </div>
            </dl>
          </Tarjeta>
        </Enlace>

        {soyElAutor ? (
          <button
            type="button"
            aria-label={`Opciones de ${ruta.nombre}`}
            onClick={() => setAccionesAbiertas(true)}
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

      <Emergente
        abierto={accionesAbiertas}
        alCerrar={() => setAccionesAbiertas(false)}
        titulo={ruta.nombre}
        acciones={
          <>
            <BotonDeEmergente
              variante="secundario"
              onClick={() => {
                setAccionesAbiertas(false);
                router.push(`/rutas/${ruta.id}/editar`);
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
