"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarSector } from "@/app/actions/territorio";
import { MapaDelSector } from "@/components/mapa/mapa-del-sector";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Anotacion, Sector } from "@/types/database";

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
  /** Todas las anotaciones: sus fotos bajan junto con el mapa del sector. */
  anotaciones: Anotacion[];
  soyAdministrador: boolean;
};

export function TarjetaDeSector({
  sector,
  todosLosSectores,
  anotaciones,
  soyAdministrador,
}: SectorCardProps) {
  const router = useRouter();
  const { avisar } = useDialogos();
  
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoSufijo, setNuevoSufijo] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const partes = sector.nombre.split(" - ");
  const prefijo = partes.length > 1 ? partes[0] : sector.nombre;
  const sufijoActual = partes.length > 1 ? partes.slice(1).join(" - ") : "";

  const iniciarEdicion = () => {
    setNuevoSufijo(sufijoActual);
    setEditandoNombre(true);
  };

  const guardarNombre = async () => {
    if (!nuevoSufijo.trim()) {
      setEditandoNombre(false);
      return;
    }
    setGuardandoNombre(true);
    const renombrarSector = (await import("@/app/actions/territorio")).renombrarSector;
    const res = await renombrarSector(sector.id, `${prefijo} - ${nuevoSufijo.trim()}`);
    setGuardandoNombre(false);
    
    if (res.ok) {
      setEditandoNombre(false);
      router.refresh();
    } else {
      await avisar({ titulo: "No se pudo cambiar el nombre", mensaje: res.error });
    }
  };

  return (
    <div className="relative">
      <Tarjeta tono="alta" className="space-y-2 overflow-hidden">
        <div className="pr-12">
          {editandoNombre ? (
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-texto shrink-0">{prefijo} -</span>
              <input
                type="text"
                value={nuevoSufijo}
                onChange={(e) => setNuevoSufijo(e.target.value)}
                disabled={guardandoNombre}
                className="flex-1 rounded-md border border-borde bg-superficie px-2 py-1 text-sm text-texto focus:border-acento focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void guardarNombre();
                  if (e.key === "Escape") setEditandoNombre(false);
                }}
              />
              <button
                type="button"
                onClick={() => void guardarNombre()}
                disabled={guardandoNombre}
                className="rounded p-1 text-acento-texto hover:bg-acento-fondo"
                aria-label="Guardar nombre"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-texto">
                {sector.nombre}
              </h3>
              {soyAdministrador ? (
                <button
                  type="button"
                  onClick={iniciarEdicion}
                  className="rounded p-1 text-texto-suave hover:bg-superficie hover:text-texto shrink-0"
                  aria-label="Editar nombre"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
              ) : null}
            </div>
          )}

          {sector.descripcion ? (
            <p className="mt-1 line-clamp-2 text-sm text-texto-suave">
              {sector.descripcion}
            </p>
          ) : null}
        </div>

        <p className="text-xs text-texto-suave">{mostrarTamano(sector.rectangulo)}</p>

        <div className="relative">
          <MapaDelSector
            sector={sector}
            todosLosSectores={todosLosSectores}
            anotaciones={anotaciones}
          />
          
          <button
            type="button"
            onClick={() => router.push(`/zonas/${sector.zonaId}/sectores/${sector.id}/anotaciones`)}
            aria-label="Ver anotaciones"
            className="absolute bottom-10 right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-acento text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </Tarjeta>
    </div>
  );
}
