"use client";

import { SUBDESTINOS_DE_MAPAS } from "@/components/armazon/destinos-del-menu";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";

/**
 * La pantalla «Mapas» del celular: las cuatro entradas como tarjetas.
 *
 * En el celular, tocar «Mapas» en la barra de abajo trae acá, y cada pantalla
 * de adentro vuelve acá. En la computadora no se usa: las cuatro entradas ya
 * están desplegadas en la barra lateral. Decisión de Ale del 2026-10-13.
 */
export function PantallaDeEntradasDeMapas() {
  return (
    <PantallaDeMapas titulo="Mapas" esLaEntrada>
      {() => (
        <ul className="space-y-3">
          {SUBDESTINOS_DE_MAPAS.map((sub) => (
            <li key={sub.href}>
              <Enlace href={sub.href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
                <Tarjeta interactiva className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verde-fondo text-verde-icono">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sub.icono}</svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-texto">{sub.etiqueta}</span>
                    <span className="block text-base leading-6 text-texto-suave">{sub.queHay}</span>
                  </span>
                </Tarjeta>
              </Enlace>
            </li>
          ))}
        </ul>
      )}
    </PantallaDeMapas>
  );
}
