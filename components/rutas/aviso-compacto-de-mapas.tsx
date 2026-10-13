"use client";

import { useState } from "react";
import { AvisoDeMapasQueFaltan } from "@/components/rutas/aviso-de-mapas-que-faltan";
import { Emergente } from "@/components/ui/emergente";
import type { CircuitoSinMapa, MapaPerdido } from "@/lib/mapas/lo-que-falta";

/**
 * Los avisos de mapas, chiquitos: una franja ámbar arriba de la lista que dice
 * cuántos hay, y que se toca para verlos enteros (pedido de Ale, 2026-10-13).
 *
 * Antes salían abiertos ocupando la pantalla: quien entraba a ver sus
 * Circuitos se encontraba primero con una lista de malas noticias. Ahora el
 * aviso sigue arriba de todo y en ámbar —en casa nada pasa desapercibido—, y
 * cada tarjeta dice cuánto mapa tiene su Circuito.
 */
export function AvisoCompactoDeMapas({ perdidos, circuitos, aviso }: {
  perdidos: MapaPerdido[];
  circuitos: CircuitoSinMapa[];
  aviso: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const partes = [
    perdidos.length > 0 ? `${perdidos.length} ${perdidos.length === 1 ? "mapa que tenías ya no está" : "mapas que tenías ya no están"}` : null,
    circuitos.length > 0 ? `${circuitos.length} ${circuitos.length === 1 ? "Circuito sin mapa" : "Circuitos sin mapa"}` : null,
    aviso ? "No se pudo revisar qué mapas tenías" : null,
  ].filter(Boolean);
  if (partes.length === 0) return null;

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} aria-haspopup="dialog"
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 text-left">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-ambar-icono" aria-hidden
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
        <span className="min-w-0 flex-1 text-sm font-medium text-ambar-texto">{partes.join(" · ")}</span>
        <span className="text-sm font-semibold text-ambar-texto">Ver</span>
      </button>
      <Emergente hoja ancho="amplio" abierto={abierto} alCerrar={() => setAbierto(false)} titulo="Mapas de tus Circuitos">
        <AvisoDeMapasQueFaltan perdidos={perdidos} circuitos={circuitos} aviso={aviso} />
      </Emergente>
    </>
  );
}
