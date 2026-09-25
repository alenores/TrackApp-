"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarRuta } from "@/app/actions/rutas";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import {
  IndicadorTecnica,
  VelocimetroEsfuerzo,
} from "@/components/rutas/indicadores-de-exigencia";
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
import type { RutaResumen, Zona } from "@/types/database";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { porcentajeDeMapa } from "@/lib/rutas/filtros";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

/**
 * Una ruta en la lista.
 *
 * La versión anterior abría editar y borrar solo manteniendo el dedo apretado.
 * Nadie lo descubría: **ningún gesto escondido puede ser la única forma de
 * hacer algo**, así que ahora hay un botón visible.
 */

type RutaCardProps = {
  ruta: RutaResumen;
  zonas: Zona[];
  conMapa: Set<number>;
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
  zonas,
  conMapa,
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
    // La ruta borrada tiene que desaparecer ya de la lista, sin cerrar la app.
    void ponerAlDiaDespuesDeGuardar();
    router.refresh();
  };

  const zonasDeLaRuta = zonas.filter((z) => seSuperponen(z.rectangulo, ruta.rectangulo));
  const nombresZonas = zonasDeLaRuta.map((z) => z.nombre).join(", ");

  const porcentajeCobertura = porcentajeDeMapa(ruta, conMapa);
  const colorCobertura = porcentajeCobertura === 100 ? "text-verde" : porcentajeCobertura >= 80 ? "text-ambar-texto" : "text-rojo-texto";

  return (
    <>
      <div className="relative">
        <Enlace href={`/rutas/${ruta.id}`} className="block">
          <Tarjeta interactiva className="space-y-3">
            <div className="space-y-2 pr-14">
              <div>
                <h2 className="min-w-0 flex-1 text-lg font-semibold text-texto leading-tight">
                  {ruta.nombre}
                </h2>
                <span className="text-[10px] uppercase tracking-widest text-texto-suave">
                  {fechaCorta(ruta.creadoEn)}
                </span>
              </div>

              {nombresZonas ? (
                <p className="text-sm font-medium text-acento">
                  {nombresZonas}
                </p>
              ) : null}

              <InsigniasDeActividad actividades={ruta.actividades} />

              {ruta.descripcion ? (
                <p className="line-clamp-2 break-words whitespace-pre-wrap text-sm leading-6 text-texto-suave">
                  {ruta.descripcion}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 pb-8 border-t border-borde/50 text-center items-start">
              <div className="flex flex-col items-center justify-start h-full">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1.5 leading-none">
                  Largo
                </span>
                <div className="flex flex-1 items-center justify-center min-h-[32px] w-full">
                  <span className="font-semibold tracking-wide text-cyan-300 [text-shadow:0_0_10px_rgba(103,232,249,0.22)]">
                    {mostrarLargo(ruta.largoKm)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start h-full">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1.5 leading-none">
                  Desnivel
                </span>
                <div className="flex flex-1 items-center justify-center min-h-[32px] w-full">
                  <span className="text-sm font-medium text-texto">
                    {ruta.desnivelPositivoM ? `+${ruta.desnivelPositivoM}m` : "—"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start h-full">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1.5 leading-none">
                  Técnica
                </span>
                <div className="flex flex-1 items-center justify-center min-h-[32px] w-full">
                  <IndicadorTecnica tecnica={ruta.dificultadTecnica} />
                </div>
              </div>

              <div className="flex flex-col items-center justify-start h-full">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1.5 leading-none">
                  Esfuerzo
                </span>
                <div className="flex flex-1 items-center justify-center min-h-[32px] w-full">
                  <VelocimetroEsfuerzo esfuerzo={ruta.nivelEsfuerzo} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-texto-suave">
              <div className="flex items-center gap-2">
                <AvatarDeQuienSubio
                  avatarUrl={avatarDelAutor}
                  uploaderLabel={autor}
                  size="sm"
                />
                <span className="font-medium text-texto">{autor}</span>
              </div>
            </div>

            {/* Porcentaje de mapa offline */}
            <div className="absolute bottom-3 right-4">
              <span className={`text-[11px] font-semibold tracking-wide ${colorCobertura}`}>
                MAPA OFFLINE {porcentajeCobertura}%
              </span>
            </div>
          </Tarjeta>
        </Enlace>

        {soyElAutor ? (
          <button
            type="button"
            aria-label={`Opciones de ${ruta.nombre}`}
            onClick={() => setAccionesAbiertas(true)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-alta hover:text-texto"
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
