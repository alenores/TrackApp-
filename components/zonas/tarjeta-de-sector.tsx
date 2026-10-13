"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapaDelSector } from "@/components/mapa/mapa-del-sector";
import { borrarSector } from "@/app/actions/territorio";
import { Tarjeta } from "@/components/ui/tarjeta";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { useDialogos } from "@/components/ui/dialogos";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Sector } from "@/types/database";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

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
      // Lo que acabás de guardar tiene que aparecer ya, sin cerrar la app.
      void ponerAlDiaDespuesDeGuardar();
      router.refresh();
    } else {
      await avisar({ titulo: "No se pudo cambiar el nombre", mensaje: res.error });
    }
  };

  const eliminar = async () => {
    const seguro = await confirmar({ titulo: `¿Borrar «${sector.nombre}»?`,
      mensaje: "Las marcas que caen adentro se quedan en el mapa. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar", destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await borrarSector(sector.id);
      if (!resultado.ok) { await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error }); return; }
      await ponerAlDiaDespuesDeGuardar();
      router.refresh();
    } catch (error) {
      await avisar({ titulo: "No se pudo borrar",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.` });
    }
  };

  return (
    <div className="relative">
      <Tarjeta tono="alta" className="space-y-2 overflow-hidden relative">
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
          />
        </div>
      </Tarjeta>
      {soyAdministrador ? <MenuDeAcciones className="absolute right-3 top-3 z-10"
        etiqueta={`Opciones de ${sector.nombre}`}
        acciones={[
          { etiqueta: "Editar nombre", alElegir: iniciarEdicion },
          { etiqueta: "Editar", alElegir: () => router.push(`/zonas/${sector.zonaId}/sectores/${sector.id}/editar`) },
          { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminar() },
        ]} /> : null}
    </div>
  );
}
