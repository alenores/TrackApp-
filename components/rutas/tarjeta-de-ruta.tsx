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
            <div className="space-y-2 pr-14">
              <div>
                <h2 className="min-w-0 flex-1 text-lg font-semibold text-texto leading-tight">
                  {ruta.nombre}
                </h2>
                <span className="text-[10px] uppercase tracking-widest text-texto-suave">
                  {fechaCorta(ruta.creadoEn)}
                </span>
              </div>

              <InsigniasDeActividad actividades={ruta.actividades} />

              {ruta.descripcion ? (
                <p className="line-clamp-2 break-words whitespace-pre-wrap text-sm leading-6 text-texto-suave">
                  {ruta.descripcion}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-borde/50 text-center items-end">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1">Largo</span>
                <span className="font-semibold tracking-wide text-cyan-300 [text-shadow:0_0_10px_rgba(103,232,249,0.22)]">
                  {mostrarLargo(ruta.largoKm)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1">Desnivel</span>
                <span className="text-sm font-medium text-texto">
                  {ruta.desnivelPositivoM ? `+${ruta.desnivelPositivoM}m` : "—"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1">Técnica</span>
                <IndicadorTecnica tecnica={ruta.dificultadTecnica} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-texto-suave mb-1">Esfuerzo</span>
                <VelocimetroEsfuerzo esfuerzo={ruta.nivelEsfuerzo} />
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

function IndicadorTecnica({ tecnica }: { tecnica: number | null }) {
  if (tecnica === null) return <span className="text-sm font-medium text-texto">—</span>;
  
  const circulitos = 5;
  const llenos = Math.ceil(tecnica / 2); // 1-2=1, 3-4=2, 5-6=3, 7-8=4, 9-10=5

  return (
    <div className="flex items-center gap-0.5 h-5" aria-label={`Técnica ${tecnica} de 10`}>
      {Array.from({ length: circulitos }).map((_, i) => (
        <div 
          key={i} 
          className={`h-2 w-2 rounded-full border border-blue-500 ${
            i < llenos ? "bg-blue-500" : "bg-transparent"
          }`} 
        />
      ))}
    </div>
  );
}

function VelocimetroEsfuerzo({ esfuerzo }: { esfuerzo: RutaResumen["nivelEsfuerzo"] }) {
  if (!esfuerzo) return <span className="text-sm font-medium text-texto">—</span>;

  // Convertimos a 1,2,3,4
  const nivel = { bajo: 1, medio: 2, alto: 3, muy_alto: 4 }[esfuerzo] || 0;
  
  // bajo -> verde, medio -> amarillo, alto -> rojo, muy alto -> rojo fuerte
  let colorFill = "#22c55e"; // verde
  if (nivel === 2) colorFill = "#eab308"; // amarillo
  if (nivel === 3) colorFill = "#ef4444"; // rojo
  if (nivel === 4) colorFill = "#b91c1c"; // rojo fuerte

  // Un velocímetro de semicírculo simple con SVG
  // Angulo de rotación de la aguja: de -90deg a 90deg
  const angulo = -90 + ((nivel - 1) / 3) * 180;

  return (
    <div className="flex flex-col items-center" aria-label={`Esfuerzo ${esfuerzo.replace("_", " ")}`}>
      <div className="relative w-8 h-4 overflow-hidden">
        {/* Fondo del arco */}
        <div className="absolute w-8 h-8 rounded-full border-[3px] border-superficie-alta border-b-transparent border-l-transparent -rotate-45" />
        {/* Aguja */}
        <div 
          className="absolute bottom-0 left-1/2 w-[1px] h-4 bg-texto origin-bottom transition-transform"
          style={{ transform: `translateX(-50%) rotate(${angulo}deg)` }}
        />
        {/* Punto central */}
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-texto -translate-x-1/2 translate-y-1/2" />
      </div>
      <span className="text-[9px] mt-0.5 text-texto font-medium capitalize" style={{ color: colorFill }}>
        {esfuerzo.replace("_", " ")}
      </span>
    </div>
  );
}
