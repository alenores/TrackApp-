"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { FlechaRedonda } from "@/components/ui/flecha-redonda";
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

export function TarjetaDeZona({
  zona,
  soyAdministrador,
  cantidadDeSectores,
}: ZonaCardProps) {
  const router = useRouter();
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const temporizadorRef = useRef<NodeJS.Timeout | null>(null);

  const iniciarToque = () => {
    if (!soyAdministrador) return;
    temporizadorRef.current = setTimeout(() => {
      setOpcionesAbiertas(true);
      temporizadorRef.current = null;
    }, 500);
  };

  const cancelarToque = () => {
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  };

  const manejarClic = () => {
    if (opcionesAbiertas) return;
    router.push(`/zonas/${zona.id}`);
  };

  return (
    <div className="relative">
      <div 
        className="block cursor-pointer select-none"
        onClick={manejarClic}
        onPointerDown={iniciarToque}
        onPointerUp={cancelarToque}
        onPointerLeave={cancelarToque}
        onPointerCancel={cancelarToque}
      >
        <Tarjeta interactiva className="relative overflow-hidden space-y-2">
          {zona.fotoUrl ? (
            <>
              <img
                src={zona.fotoUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/30" />
            </>
          ) : null}

          <div className="relative z-10 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className={`truncate text-lg font-bold ${zona.fotoUrl ? "text-white drop-shadow-md" : "text-texto"}`}>
                  {zona.nombre}
                </h2>

                {zona.descripcion ? (
                  <p className={`mt-1 line-clamp-2 text-sm leading-6 ${zona.fotoUrl ? "text-slate-200 drop-shadow-sm" : "text-texto-suave"}`}>
                    {zona.descripcion}
                  </p>
                ) : null}
              </div>

              <FlechaRedonda direction="right" className={`-mt-0.5 shrink-0 ${zona.fotoUrl ? "border-white/30 bg-black/40 text-white" : ""}`} />
            </div>

            {cantidadDeSectores !== undefined ? (
              <p className={`text-xs font-medium ${zona.fotoUrl ? "text-slate-300 drop-shadow-sm" : "text-texto-suave"}`}>
                {cantidadDeSectores === 0
                  ? "Todavía no tiene sectores"
                  : cantidadDeSectores === 1
                    ? "1 sector"
                    : `${cantidadDeSectores} sectores`}
              </p>
            ) : null}
          </div>
        </Tarjeta>
      </div>

      {opcionesAbiertas ? (
        <div className="absolute inset-0 z-10 flex items-center justify-end gap-3 rounded-2xl bg-superficie/90 px-4 backdrop-blur-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpcionesAbiertas(false);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-superficie text-texto shadow-sm transition-colors hover:bg-superficie-alta"
            aria-label="Cerrar opciones"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/zonas/${zona.id}/editar`);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-superficie-alta text-texto shadow-sm transition-colors hover:bg-superficie-altisima"
            aria-label="Editar"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          

        </div>
      ) : null}
    </div>
  );
}
